// To make it easier to work with the database, disable prettier and some eslint rules for this file
/* eslint-disable no-inline-comments */
/* eslint-disable prettier/prettier */
import { sql } from "drizzle-orm";
import { pgTable, serial, text, boolean, timestamp, decimal, unique, index, pgEnum, jsonb, integer, check } from "drizzle-orm/pg-core";

export const dbDiscordTable = pgTable("discord", {
    guildId: text("guild_id").primaryKey(),
    allowedPublicSharing: boolean("allowed_public_sharing").notNull().default(false),
    feedrUpdatesChannelId: text("feedr_updates_channel_id"),
    isInServer: boolean("is_in_server").notNull().default(true),
    memberCount: integer("member_count").notNull().default(0),
    isDm: boolean("is_dm").notNull().default(false),
}, (table) => [
    check("discord_is_dm_constraint",
        sql`NOT ${table.isDm} OR (
            ${table.allowedPublicSharing} = false AND
            ${table.feedrUpdatesChannelId} = ${table.guildId} AND
            ${table.isInServer} = true AND
            ${table.memberCount} = 0
        )`
    )
]);

export const dbYouTubeTable = pgTable("youtube", {
    youtubeChannelId: text("youtube_channel_id").primaryKey(),
    youtubeChannelName: text("youtube_channel_name").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    latestAllId: text("latest_all_id"), // For verification and optimisation purposes
    latestVideoId: text("latest_video_id"),
    latestVideoIdUpdated: timestamp("latest_video_id_updated"),
    latestShortId: text("latest_short_id"),
    latestShortIdUpdated: timestamp("latest_short_id_updated"),
    latestStreamId: text("latest_stream_id"),
    latestStreamIdUpdated: timestamp("latest_stream_id_updated"),
    youtubeChannelIsLive: boolean("youtube_channel_is_live").notNull().default(false),
    youtubeLiveIds: text("youtube_live_ids").array().notNull().default([]),
}, (table) => [
    index("idx_youtube_channel_id").on(table.youtubeChannelId),
]);

export const dbTwitchTable = pgTable("twitch", {
    twitchChannelId: text("twitch_channel_id").primaryKey(),
    isActive: boolean("is_active").notNull().default(true),
    twitchChannelIsLive: boolean("twitch_channel_is_live").notNull().default(false),
    twitchChannelName: text("twitch_channel_name").notNull().default(""),
}, (table) => [
    index("idx_twitch_channel_id").on(table.twitchChannelId),
]);

export const dbGuildYouTubeSubscriptionsTable = pgTable("guild_youtube_subscriptions", {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull().references(() => dbDiscordTable.guildId),
    youtubeChannelId: text("youtube_channel_id").notNull().references(() => dbYouTubeTable.youtubeChannelId),
    notificationChannelId: text("notification_channel_id").notNull(),
    notificationRoleId: text("notification_role_id"),
    isDm: boolean("is_dm").notNull().default(false),
    trackVideos: boolean("track_videos").notNull().default(false),
    trackShorts: boolean("track_shorts").notNull().default(false),
    trackStreams: boolean("track_streams").notNull().default(false),
}, (table) => [
    unique("guild_youtube_subscription").on(table.guildId, table.youtubeChannelId),
]);

export const dbGuildTwitchSubscriptionsTable = pgTable("guild_twitch_subscriptions", {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull().references(() => dbDiscordTable.guildId),
    twitchChannelId: text("twitch_channel_id").notNull().references(() => dbTwitchTable.twitchChannelId),
    notificationChannelId: text("notification_channel_id").notNull(),
    notificationRoleId: text("notification_role_id"),
    isDm: boolean("is_dm").notNull().default(false),
    latestMessageId: text("latest_message_id"),
}, (table) => [
    unique("guild_twitch_subscription").on(table.guildId, table.twitchChannelId),
]);

export const dbBotInfoTable = pgTable("bot_info", {
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    guildsTotal: integer("guilds_total").notNull().default(0),
    channelsTracked: integer("channels_tracked").notNull().default(0),
    totalMembers: integer("total_members").notNull().default(0),
    notificationsSent: integer("notifications_sent").notNull().default(0),
});

export const dbBotInfoNotificationsTable = pgTable("bot_info_notifications", {
    timestamp: timestamp("timestamp").notNull(),
    service: text("service").notNull(),
    delay: decimal("delay", { precision: 10, scale: 2 }).notNull().default("0.0"),
});

// Deprecated, but kept for reference
// export const dbBotInfoNotificationsTimingsTable = pgTable("bot_info_notifications_timings", {
//     time: timestamp("time").notNull(),
//     channelId: text("channel_id").notNull().references(() => dbYouTubeTable.youtubeChannelId),
//     timeMs: integer("time_ms").notNull().default(0),
// });

// Once again, can be aggregated in the API
// export const dbBotInfoTopChannelsTable = pgTable("bot_info_top_channels", {
//     youtubeChannelId: text("youtube_channel_id").primaryKey().references(() => dbYouTubeTable.youtubeChannelId),
//     guildsTracking: integer("guilds_tracking").notNull().default(0),
// });

// Once again, can be aggregated in the API
// export const dbBotInfoTopGuildsTable = pgTable("bot_info_top_guilds", {
//     guildId: text("guild_id").primaryKey().references(() => dbDiscordTable.guildId),
//     members: integer("members").notNull().default(0),
// });

export const dbAuditLogsEventTypeEnum = pgEnum("event_type", [
    "subscription_created",
    "subscription_deleted",
    "notification_sent",
    "guild_joined",
    "guild_left",
]);

export const dbAuditLogsSuccessTypeEnum = pgEnum("audit_log_success", [
    "success",
    "failure",
    "info",
    "warning",
]);

export const dbAuditLogsTable = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    eventType: dbAuditLogsEventTypeEnum().notNull(),
    successType: dbAuditLogsSuccessTypeEnum().notNull(),
    data: jsonb("data"),
    occurredAt: timestamp("occurred_at").defaultNow(),
});

export default {
    dbDiscordTable,
    dbYouTubeTable,
    dbTwitchTable,
    dbGuildYouTubeSubscriptionsTable,
    dbGuildTwitchSubscriptionsTable,
    dbBotInfoTable,
    dbBotInfoNotificationsTable,
    dbAuditLogsEventTypeEnum,
    dbAuditLogsSuccessTypeEnum,
    dbAuditLogsTable,
};
