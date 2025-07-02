import { Platform } from "../../types/types";
import { pool } from "../database";

export async function checkIfGuildIsTrackingUserAlready(
    platform: Platform,
    userId: string,
    guildId: string,
): Promise<boolean> {
    console.log(
        `Checking if guild ${guildId} is tracking user ${userId} on platform ${platform}`,
    );

    let query: string | null = null;

    if (platform === Platform.YouTube) {
        query = `
            SELECT * FROM guild_youtube_subscriptions
            WHERE youtube_channel_id = ? AND guild_id = ?
        `;
    } else if (platform === Platform.Twitch) {
        query = `
            SELECT * FROM guild_twitch_subscriptions
            WHERE twitch_user_id = ? AND guild_id = ?
        `;
    }

    if (!query) {
        console.error("Invalid platform provided for tracking check.");

        return false;
    }

    try {
        const client = await pool.connect();
        const result = await client.query(query, [userId, guildId]);

        client.release();

        return result.rows.length > 0;
    } catch (error) {
        console.error("Error checking if guild is tracking user:", error);

        return false;
    }
}
