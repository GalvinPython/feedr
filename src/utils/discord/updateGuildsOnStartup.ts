import { eq } from "drizzle-orm";

import { dbDiscordTable } from "../../db/schema";
import client from "../../client";
import { dbAuditLogCreate } from "../../db/audit";
import { db } from "../../db/db";
import {
    discordAddNewGuild,
    discordRemoveGuildFromTracking,
} from "../../db/discord";
import {
    syncTwitchChannelActiveState,
    syncYouTubeChannelActiveState,
} from "../../db/channelActiveState";

let isReconcilingGuilds = false;

export default async function updateGuildsOnStartup(
    source: "startup" | "cron" = "startup",
) {
    if (isReconcilingGuilds) return;
    isReconcilingGuilds = true;
    try {
        const stored = await db
            .select()
            .from(dbDiscordTable)
            .where(eq(dbDiscordTable.isDm, false));
        const storedIds = new Set(stored.map((guild) => guild.guildId));
        // A failed fetch must never trigger deletion.
        const guildIds = new Set<string>();
        let after: string | undefined;
        let hasMore = true;

        while (hasMore) {
            const page = await client.guilds.fetch({ limit: 200, after });

            for (const guild of page.values()) guildIds.add(guild.id);
            hasMore = page.size === 200;
            if (hasMore) {
                after = page.last()?.id;
                if (!after)
                    throw new Error("Could not paginate Discord guilds");
            }
        }

        for (const guild of stored) {
            try {
                if (
                    !guildIds.has(guild.guildId) &&
                    !client.guilds.cache.has(guild.guildId)
                ) {
                    const result = await discordRemoveGuildFromTracking(
                        guild.guildId,
                    );

                    if (!result.success || result.changed)
                        await dbAuditLogCreate(
                            guild.guildId,
                            "guild_left",
                            result.success ? "success" : "failure",
                            { source },
                        );
                    if (!result.success)
                        throw new Error(
                            `Failed to remove guild ${guild.guildId}`,
                        );
                } else if (!guild.isInServer) {
                    await db
                        .update(dbDiscordTable)
                        .set({ isInServer: true })
                        .where(eq(dbDiscordTable.guildId, guild.guildId));
                }
            } catch (error) {
                console.error("Error reconciling guild:", guild.guildId, error);
            }
        }
        for (const guildId of guildIds) {
            if (!storedIds.has(guildId)) {
                try {
                    const result = await discordAddNewGuild(guildId, false);

                    if (!result.success)
                        throw new Error(`Failed to add guild ${guildId}`);
                    if (result.changed)
                        await dbAuditLogCreate(
                            guildId,
                            "guild_joined",
                            "success",
                            { source },
                        );
                } catch (error) {
                    await dbAuditLogCreate(guildId, "guild_joined", "failure", {
                        source,
                        error: String(error),
                    });
                    console.error("Error adding guild:", guildId, error);
                }
            }
        }
    } catch (error) {
        console.error("Error reconciling Discord guilds:", error);
    } finally {
        try {
            await syncYouTubeChannelActiveState();
        } catch (error) {
            console.error("Error syncing YouTube channels:", error);
        }
        try {
            await syncTwitchChannelActiveState();
        } catch (error) {
            console.error("Error syncing Twitch channels:", error);
        }
        isReconcilingGuilds = false;
    }
}
