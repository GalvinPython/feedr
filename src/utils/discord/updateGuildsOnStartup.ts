import { eq } from "drizzle-orm";

import { dbDiscordTable } from "../../db/schema";
import client from "../../client";
import { db } from "../../db/db";
import {
    discordAddNewGuild,
    discordRemoveGuildFromTracking,
} from "../../db/discord";
import {
    syncTwitchChannelActiveState,
    syncYouTubeChannelActiveState,
} from "../../db/channelActiveState";

export default async function updateGuildsOnStartup() {
    try {
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
        const stored = await db
            .select()
            .from(dbDiscordTable)
            .where(eq(dbDiscordTable.isDm, false));

        for (const guild of stored) {
            if (!guildIds.has(guild.guildId)) {
                const result = await discordRemoveGuildFromTracking(
                    guild.guildId,
                );

                if (!result.success)
                    throw new Error(`Failed to remove guild ${guild.guildId}`);
            } else if (!guild.isInServer) {
                await db
                    .update(dbDiscordTable)
                    .set({ isInServer: true })
                    .where(eq(dbDiscordTable.guildId, guild.guildId));
            }
        }
        for (const guildId of guildIds) {
            if (!stored.some((row) => row.guildId === guildId)) {
                const fullGuild = await client.guilds.fetch(guildId);
                const result = await discordAddNewGuild(
                    guildId,
                    false,
                    fullGuild.memberCount,
                );

                if (!result.success)
                    throw new Error(`Failed to add guild ${guildId}`);
            }
        }
        await syncYouTubeChannelActiveState();
        await syncTwitchChannelActiveState();
    } catch (error) {
        console.error("Error reconciling Discord guilds:", error);
    }
}
