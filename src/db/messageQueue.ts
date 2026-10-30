import type { dbGuildYouTubeSubscriptionsTable } from "./schema";

import { Database } from "bun:sqlite";

type Subscription = typeof dbGuildYouTubeSubscriptionsTable.$inferSelect;

export interface QueuedNotification {
    id: number;
    video_id: string;
    channel_name: string | null;
    notification_channel_id: string;
    notification_role_id: string | null;
}

const database = new Database(
    process.env.MESSAGE_QUEUE_PATH || "message-queue.sqlite",
    { create: true },
);

database.run("PRAGMA journal_mode = WAL;");
database.run("PRAGMA busy_timeout = 5000;");
database.run(`CREATE TABLE IF NOT EXISTS youtube_notification_queue (
    id INTEGER PRIMARY KEY,
    video_id TEXT NOT NULL,
    youtube_channel_id TEXT NOT NULL,
    channel_name TEXT,
    guild_id TEXT NOT NULL,
    notification_channel_id TEXT NOT NULL,
    notification_role_id TEXT,
    is_dm INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, guild_id, notification_channel_id)
)`);

const insert = database.query(`INSERT INTO youtube_notification_queue
    (video_id, youtube_channel_id, channel_name, guild_id, notification_channel_id, notification_role_id, is_dm, content_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(video_id, guild_id, notification_channel_id) DO NOTHING`);

export function enqueueNotifications(
    videoId: string,
    channelId: string,
    channelName: string | null,
    contentType: string,
    subscriptions: Subscription[],
): void {
    database.transaction(() => {
        for (const subscription of subscriptions) {
            insert.run(
                videoId,
                channelId,
                channelName,
                subscription.guildId,
                subscription.notificationChannelId,
                subscription.notificationRoleId,
                Number(subscription.isDm),
                contentType,
            );
        }
    })();
}

export function getQueuedNotifications(): QueuedNotification[] {
    return database
        .query<QueuedNotification, []>(
            "SELECT id, video_id, channel_name, notification_channel_id, notification_role_id FROM youtube_notification_queue ORDER BY id",
        )
        .all();
}

export function deleteQueuedNotification(id: number): void {
    database
        .query("DELETE FROM youtube_notification_queue WHERE id = ?")
        .run(id);
}
