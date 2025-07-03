import { Platform } from "../../types/types.d";
import { pool } from "../database";

export async function checkIfGuildIsTrackingUserAlready(
    platform: Platform,
    userId: string,
    guildId: string,
): Promise<{ success: boolean; data: any[] | null }> {
    console.log(
        `Checking if guild ${guildId} is tracking user ${userId} on platform ${platform}`,
    );

    let query: string | null = null;

    if (platform === Platform.YouTube) {
        query = `
            SELECT * FROM guild_youtube_subscriptions
            WHERE youtube_channel_id = $1 AND guild_id = $2
        `;
    } else if (platform === Platform.Twitch) {
        query = `
            SELECT * FROM guild_twitch_subscriptions
            WHERE twitch_user_id = $1 AND guild_id = $2
        `;
    }

    if (!query) {
        console.error("Invalid platform provided for tracking check.");

        return { success: false, data: null };
    }

    try {
        const client = await pool.connect();
        const result = await client.query(query, [userId, guildId]);

        client.release();

        if (result.rows.length > 0) {
            return { success: true, data: result.rows };
        } else {
            return { success: false, data: null };
        }
    } catch (error) {
        console.error("Error checking if guild is tracking user:", error);

        return { success: false, data: null };
    }
}
