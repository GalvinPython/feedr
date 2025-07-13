// To make it easier to work with the database, disable prettier for this file
/* eslint-disable prettier/prettier */
import { pgTable, serial, text, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";

export const dbDiscordTable = pgTable("discord", {
    guildId: text("guild_id").primaryKey(),
    allowedPublicSharing: boolean("allowed_public_sharing").notNull().default(false),
    feedrUpdatesChannelId: text("feedr_updates_channel_id"),

});

export const dbBlueskyTable = pgTable("bluesky", {
    blueskyUserId: text("bluesky_user_id").primaryKey(),
    latestPostId: text("latest_post_id"),
    latestReplyId: text("latest_reply_id"),
});

export const dbYouTubeTable = pgTable("youtube", {
    youtubeChannelId: text("youtube_channel_id").primaryKey(),
    latestVideoId: text("latest_video_id"),
    latestVideoIdUpdated: timestamp("latest_video_id_updated"),
    latestShortId: text("latest_short_id"),
    latestShortIdUpdated: timestamp("latest_short_id_updated"),
    latestStreamId: text("latest_stream_id"),
    latestStreamIdUpdated: timestamp("latest_stream_id_updated"),
    youtubeChannelIsLive: boolean("youtube_channel_is_live"),
});

export const dbTwitchTable = pgTable("twitch", {
    twitchChannelId: text("twitch_channel_id").primaryKey(),
    twitchChannelIsLive: boolean("twitch_channel_is_live").notNull(),
});

export const dbGuildBlueskySubscriptionsTable = pgTable("guild_bluesky_subscriptions", {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull().references(() => dbDiscordTable.guildId),
    blueskyUserId: text("bluesky_user_id").notNull().references(() => dbBlueskyTable.blueskyUserId),
    notificationChannelId: text("notification_channel_id").notNull(),
    notificationRoleId: text("notification_role_id"),
    isDm: boolean("is_dm").notNull().default(false),
    checkForReplies: boolean("check_for_replies").notNull().default(false),
});

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
});

export const dbGuildTwitchSubscriptionsTable = pgTable("guild_twitch_subscriptions", {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull().references(() => dbDiscordTable.guildId),
    twitchChannelId: text("twitch_channel_id").notNull().references(() => dbTwitchTable.twitchChannelId),
    notificationChannelId: text("notification_channel_id").notNull(),
    notificationRoleId: text("notification_role_id"),
    isDm: boolean("is_dm").notNull().default(false),
});

export const dbBotInfoTable = pgTable("bot_info", {
    guildsTotal: integer("guilds_total").notNull().default(0),
    channelsTracked: integer("channels_tracked").notNull().default(0),
    totalMembers: integer("total_members").notNull().default(0),
    time: timestamp("time").notNull().defaultNow(),
});

export const dbBotInfoNotificationsTable = pgTable("bot_info_notifications", {
    date: date("date").notNull(),
    totalYouTube: integer("total_youtube").notNull().default(0),
    totalTwitch: integer("total_twitch").notNull().default(0),
});

export const dbBotInfoNotificationsTimingsTable = pgTable("bot_info_notifications_timings", {
    time: timestamp("time").notNull(),
    channelId: text("channel_id").notNull().references(() => dbYouTubeTable.youtubeChannelId),
    timeMs: integer("time_ms").notNull().default(0),
});

export const dbBotInfoTopChannelsTable = pgTable("bot_info_top_channels", {
    youtubeChannelId: text("youtube_channel_id").primaryKey().references(() => dbYouTubeTable.youtubeChannelId),
    guildsTracking: integer("guilds_tracking").notNull().default(0),
});

export const dbBotInfoTopGuildsTable = pgTable("bot_info_top_guilds", {
    guildId: text("guild_id").primaryKey().references(() => dbDiscordTable.guildId),
    members: integer("members").notNull().default(0),
});

export const dbAuditLogsTable = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    eventType: text("event_type").notNull(),
    guildId: text("guild_id").notNull().references(() => dbDiscordTable.guildId),
    relatedId: text("related_id").notNull(),
    note: text("note"),
    occurredAt: timestamp("occurred_at").defaultNow(),
});
