// Checks for any guilds that may have been added/removed while the bot was offline
import { eq } from "drizzle-orm";

import { dbDiscordTable } from "../../db/schema";
import client from "../..";
import { db } from "../../db/db";
import { config } from "../../config";

export default async function () {
    console.log("Checking for guilds to update on startup...");

    let currentGuilds: string[] = [];

    // Keep checking every 10 seconds until currentGuilds is not empty
    while (currentGuilds.length === 0) {
        console.log("Waiting for guilds to load...");
        currentGuilds = client.guilds.cache.map((guild) => guild.id);
        if (currentGuilds.length === 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, config.discordWaitForGuildCacheTime),
            );
        }
    }

    // Get all the guilds from the database
    const data = await db.select().from(dbDiscordTable);

    console.log(
        `Currently in ${currentGuilds.length} guilds, checking against ${data.length} in the database.`,
    );

    // Find any guilds that are in the database but not in the current guilds
    const missingGuilds = data.filter(
        (guild) => !currentGuilds.includes(guild.guildId) && !guild.isDm,
    );

    // Find any guilds that are in the current guilds but not in the database
    const newGuilds = currentGuilds.filter(
        (id) => !data.some((guild) => guild.guildId === id),
    );

    // Update the database for missing guilds
    try {
        await Promise.all(
            missingGuilds.map(async (guild) => {
                console.log(`Removing guild from tracking: ${guild.guildId}`);
                const result = await db
                    .update(dbDiscordTable)
                    .set({ isInServer: false })
                    .where(eq(dbDiscordTable.guildId, guild.guildId))
                    .returning();

                if (result.length > 0) {
                    console.log(
                        `Successfully removed guild ${guild.guildId} from tracking.`,
                    );
                } else {
                    console.error(
                        `Failed to remove guild ${guild.guildId} from tracking.`,
                    );
                }
            }),
        );
    } catch (error) {
        console.error("Error while removing missing guilds:", error);
    }

    try {
        await Promise.all(
            newGuilds.map(async (guildId) => {
                console.log(`Adding new guild to tracking: ${guildId}`);
                const result = await db
                    .insert(dbDiscordTable)
                    .values({
                        guildId,
                        allowedPublicSharing: false,
                        feedrUpdatesChannelId: null,
                        isInServer: true,
                        memberCount: 0,
                    })
                    .returning();

                if (result.length > 0) {
                    console.log(
                        `Successfully added guild ${guildId} to tracking.`,
                    );
                } else {
                    console.error(
                        `Failed to add guild ${guildId} to tracking.`,
                    );
                }
            }),
        );
    } catch (error) {
        console.error("Error while adding new guilds:", error);
    }
}
