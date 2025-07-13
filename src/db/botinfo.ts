import type { PoolClient, QueryResult } from "pg";
import type { dbBotInfo } from "../types/database";

import { pool } from "../utils/database";

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

export async function updateBotInfoNotifications(
    platform: "youtube" | "bluesky" | "twitch",
) {
    const query = `
        INSERT INTO bot_info_notifications (date, total_${platform})
        VALUES (CURRENT_DATE, 1)
        ON CONFLICT (date) DO UPDATE
        SET total_${platform} = bot_info_notifications.total_${platform} + 1;
    `;

    try {
        const client: PoolClient = await pool.connect();

        await client.query(query, [platform]);

        client.release();

        console.log(`Bot info notifications updated for ${platform}`);
    } catch (err) {
        console.error(
            `Error updating bot info notifications for ${platform}:`,
            err,
        );
    }
}

export async function getBotInfoNotifications() {
    const query = `SELECT * FROM bot_info_notifications`;

    try {
        const client: PoolClient = await pool.connect();
        const result: QueryResult<any> = await client.query(query);

        client.release();

        return result.rows;
    } catch (err) {
        console.error("Error getting bot info notifications:", err);

        return [];
    }
}

export async function updateBotInfoNotificationsTimings(
    channel_id: string,
    time_ms: number,
): Promise<void> {
    const query = `
        INSERT INTO bot_info_notifications_timings (time, channel_id, time_ms)
        VALUES (NOW(), $1, $2)
        ON CONFLICT (time, channel_id) DO UPDATE
        SET time_ms = EXCLUDED.time_ms;
    `;

    try {
        const client: PoolClient = await pool.connect();

        await client.query(query, [channel_id, time_ms]);

        client.release();

        console.log(
            `Bot info notifications timings updated for channel ${channel_id}`,
        );
    } catch (err) {
        console.error(
            `Error updating bot info notifications timings for channel ${channel_id}:`,
            err,
        );
    }
}
