import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sqliteBotInfo = sqliteTable("bot_info", {
    totalServers: integer("total_servers").notNull(),
    totalMembers: integer("total_members").notNull(),
});

export const sqliteDiscord = sqliteTable("discord", {
    guildId: text("guild_id").notNull(),
    guildChannelId: text("guild_channel_id").notNull(),
    guildPlatform: text("guild_platform").notNull(),
    platformUserId: text("platform_user_id").notNull(),
    guildPingRole: text("guild_ping_role"),
});

export const sqliteTwitch = sqliteTable("twitch", {
    twitchChannelId: text("twitch_channel_id").notNull(),
    isLive: integer("is_live").notNull(),
});

export const sqliteYouTube = sqliteTable("youtube", {
    youtubeChannelId: text("youtube_channel_id").notNull(),
    latestVideoId: text("latest_video_id"),
});
