import type { dbTwitch } from "../types/database";

import { pool } from "../utils/database";

export async function dbTwitchGetAllChannelsToTrack(): Promise<{
    success: boolean;
    data: dbTwitch[] | [];
}> {
    const query = `SELECT * FROM twitch`;

    try {
        const client = await pool.connect();
        const result = await client.query(query);

        client.release();

        return {
            success: true,
            data: result.rows as dbTwitch[],
        };
    } catch (err) {
        console.error("Error getting all channels to track:", err);

        return {
            success: false,
            data: [],
        };
    }
}

export async function checkIfStreamerIsAlreadyTracked(
    streamerId: string,
): Promise<{ success: boolean; data: dbTwitch[] | [] }> {
    const query = `
        SELECT * FROM twitch
        WHERE twitch_channel_id = $1
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(query, [streamerId]);

        client.release();

        if (result.rows.length > 0) {
            return { success: true, data: result.rows };
        } else {
            return { success: true, data: [] };
        }
    } catch (error) {
        console.error("Error checking if streamer is already tracked:", error);

        return { success: false, data: [] };
    }
}

export async function addNewStreamerToTrack(
    streamerId: string,
    isLive: boolean,
): Promise<{ success: boolean; data?: dbTwitch }> {
    const query = `
        INSERT INTO twitch (twitch_channel_id, twitch_channel_is_live)
        VALUES ($1, $2)
        RETURNING *
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(query, [streamerId, isLive]);

        client.release();

        return { success: true, data: result.rows[0] as dbTwitch };
    } catch (error) {
        console.error("Error adding new streamer to track:", error);

        return { success: false };
    }
}