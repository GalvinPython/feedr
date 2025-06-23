import { pool } from "../database";

export async function cronUpdateTopChannels(): Promise<void> {
    const query = `
        TRUNCATE TABLE bot_info_top_channels;

        INSERT INTO bot_info_top_channels (youtube_channel_id, guilds_tracking)
        SELECT youtube_channel_id, COUNT(*) AS guilds_tracking
        FROM guild_youtube_subscriptions
        GROUP BY youtube_channel_id
        ORDER BY guilds_tracking DESC;
    `;

    try {
        const client = await pool.connect();

        await client.query(query);
        client.release();
    } catch (error) {
        console.error("Error updating top channels:", error);
    }
}
