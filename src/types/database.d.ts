// This file contains TypeScript interfaces for the database schema used in the application.
// YouTube Table Interface
export interface dbYouTube {
    youtube_channel_id: string;
    latest_video_id: string | null;
    latest_video_id_updated: Date | null;
    latest_short_id: string | null;
    latest_short_id_updated: Date | null;
    latest_stream_id: string | null;
    latest_stream_id_updated: Date | null;
    youtube_channel_is_live: boolean;
}

// Twitch Table Interface
export interface dbTwitch {
    twitch_channel_id: string;
    is_live: boolean;
}

// Guild YouTube Subscriptions Table Interface
export interface dbDiscordTable {
    guild_id: string;
    guild_channel_id: string;
    guild_platform: string;
    platform_user_id: string;
    guild_ping_role: null | string;
}

// Bot Info Table Interface
export interface dbBotInfo {
    locked_row: boolean;
    guilds_total: number;
    channels_tracked: number;
    total_members: number;
    updated_at: string;
    extended_info_updated_at: string;
}
