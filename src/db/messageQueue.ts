import type { dbGuildYouTubeSubscriptionsTable } from "./schema";

import path from "node:path";

import { Database } from "bun:sqlite";

import { runningInDevMode, runningInStagingMode } from "../config";

type Subscription = typeof dbGuildYouTubeSubscriptionsTable.$inferSelect;
export interface QueuedNotification {
    id: number;
    video_id: string;
    youtube_channel_id: string;
    guild_id: string;
    is_dm: number;
    channel_name: string | null;
    notification_channel_id: string;
    notification_role_id: string | null;
    content_type: string;
    attempts: number;
}
const filename = runningInDevMode
    ? "message-queue.dev.sqlite"
    : runningInStagingMode
      ? "message-queue.staging.sqlite"
      : "message-queue.sqlite";
const database = new Database(
    path.resolve(
        import.meta.dir,
        "../../",
        process.env.MESSAGE_QUEUE_PATH || filename,
    ),
    { create: true },
);

database.run("PRAGMA journal_mode = WAL;");
database.run("PRAGMA busy_timeout = 5000;");
database.run(`CREATE TABLE IF NOT EXISTS youtube_notification_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT, video_id TEXT NOT NULL, youtube_channel_id TEXT NOT NULL,
    channel_name TEXT, guild_id TEXT NOT NULL, notification_channel_id TEXT NOT NULL,
    notification_role_id TEXT, is_dm INTEGER NOT NULL, content_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, guild_id, notification_channel_id)
)`);
const columns = database
    .query<{ name: string }, []>(
        "PRAGMA table_info(youtube_notification_queue)",
    )
    .all();

for (const [name, definition] of [
    ["sent_at", "TEXT"],
    ["attempts", "INTEGER NOT NULL DEFAULT 0"],
    ["next_attempt_at", "TEXT"],
]) {
    if (!columns.some((column) => column.name === name))
        database.run(
            `ALTER TABLE youtube_notification_queue ADD COLUMN ${name} ${definition}`,
        );
}
const queueDefinition = database
    .query<{ sql: string }, []>(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'youtube_notification_queue'",
    )
    .get();

if (queueDefinition && !/\bAUTOINCREMENT\b/i.test(queueDefinition.sql)) {
    database.transaction(() => {
        database.run(
            "ALTER TABLE youtube_notification_queue RENAME TO youtube_notification_queue_old",
        );
        database.run(`CREATE TABLE youtube_notification_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT, video_id TEXT NOT NULL, youtube_channel_id TEXT NOT NULL,
            channel_name TEXT, guild_id TEXT NOT NULL, notification_channel_id TEXT NOT NULL,
            notification_role_id TEXT, is_dm INTEGER NOT NULL, content_type TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_at TEXT,
            attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT,
            UNIQUE(video_id, guild_id, notification_channel_id)
        )`);
        database.run(`INSERT INTO youtube_notification_queue
            (id, video_id, youtube_channel_id, channel_name, guild_id, notification_channel_id,
             notification_role_id, is_dm, content_type, created_at, sent_at, attempts, next_attempt_at)
            SELECT id, video_id, youtube_channel_id, channel_name, guild_id, notification_channel_id,
             notification_role_id, is_dm, content_type, created_at, sent_at, attempts, next_attempt_at
            FROM youtube_notification_queue_old`);
        database.run("DROP TABLE youtube_notification_queue_old");
    })();
}
const insert = database.query(`INSERT INTO youtube_notification_queue
    (video_id, youtube_channel_id, channel_name, guild_id, notification_channel_id, notification_role_id, is_dm, content_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(video_id, guild_id, notification_channel_id) DO NOTHING`);

export function enqueueNotifications(
    videoId: string,
    channelId: string,
    channelName: string | null,
    contentType: string,
    subscriptions: Subscription[],
): void {
    database.transaction(() => {
        for (const subscription of subscriptions)
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
    })();
}
export function getQueuedNotifications(): QueuedNotification[] {
    database.run(
        "DELETE FROM youtube_notification_queue WHERE sent_at IS NOT NULL AND sent_at < datetime('now', '-7 days')",
    );

    return database
        .query<QueuedNotification, []>(
            "SELECT * FROM youtube_notification_queue WHERE sent_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= datetime('now')) ORDER BY id",
        )
        .all();
}
export function markNotificationSent(id: number): void {
    database
        .query(
            "UPDATE youtube_notification_queue SET sent_at = datetime('now') WHERE id = ?",
        )
        .run(id);
}
export function retryNotification(id: number, attempts: number): void {
    database
        .query(
            "UPDATE youtube_notification_queue SET attempts = ?, next_attempt_at = datetime('now', ?) WHERE id = ?",
        )
        .run(
            attempts,
            `+${Math.min(3600, 30 * 2 ** (attempts - 1))} seconds`,
            id,
        );
}
export function deleteQueuedNotification(id: number): void {
    database
        .query("DELETE FROM youtube_notification_queue WHERE id = ?")
        .run(id);
}
export function deleteQueuedNotificationsForGuild(guildId: string): void {
    database
        .query(
            "DELETE FROM youtube_notification_queue WHERE guild_id = ? AND sent_at IS NULL",
        )
        .run(guildId);
}
export function deleteQueuedNotificationsForSubscription(
    guildId: string,
    channelId: string,
    notificationChannelId: string,
): void {
    database
        .query(
            "DELETE FROM youtube_notification_queue WHERE guild_id = ? AND youtube_channel_id = ? AND notification_channel_id = ? AND sent_at IS NULL",
        )
        .run(guildId, channelId, notificationChannelId);
}
