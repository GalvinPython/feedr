import type { PoolClient, QueryResult } from "pg";
import { pool } from "../database";
import type { dbBotInfo } from "../../types/database";

export async function updateBotInfo(
    guilds_total: number = 0,
    channels_tracked: number = 0,
    total_members: number = 0,
): Promise<void> {
    const query = `
        UPDATE bot_info
        SET guilds_total = $1, channels_tracked = $2, total_members = $3, updated_at = NOW()
        WHERE locked_row = true;
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
