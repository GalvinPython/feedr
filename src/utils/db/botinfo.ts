import type { PoolClient, QueryResult } from "pg";
import type { dbBotInfo } from "../../types/database";

import { pool } from "../database";

export async function updateBotInfo(
    guilds_total: number = 0,
    channels_tracked: number = 0,
    total_members: number = 0,
): Promise<void> {
    const query = `
        INSERT INTO bot_info (guilds_total, channels_tracked, total_members, time)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (time) DO UPDATE
        SET guilds_total = EXCLUDED.guilds_total,
            channels_tracked = EXCLUDED.channels_tracked,
            total_members = EXCLUDED.total_members;
    `;

    try {
        const client = await pool.connect();

        await client.query(query, [
            guilds_total,
            channels_tracked,
            total_members,
        ]);

        client.release();

        console.log("Bot info updated successfully");
    } catch (err) {
        console.error("Error updating bot info:", err);
    }
}

export async function getBotInfo() {
    const query = `SELECT * FROM bot_info`;

    try {
        const client: PoolClient = await pool.connect();
        const result: QueryResult<any> = await client.query(query);

        client.release();

        return result.rows[0] as dbBotInfo;
    } catch (err) {
        console.error("Error getting bot info:", err);

        return null;
    }
}
