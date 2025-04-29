import type { dbYouTube } from "../../types/database";

import { pool } from "../database";

export async function dbYouTubeGetAllChannelsToTrack(): Promise<
    dbYouTube[] | []
> {
    const query = `SELECT * FROM youtube`;

    try {
        const client = await pool.connect();
        const result = await client.query(query);

        client.release();

        return result.rows as dbYouTube[];
    } catch (err) {
        console.error("Error getting all channels to track:", err);

        return [];
    }
}
