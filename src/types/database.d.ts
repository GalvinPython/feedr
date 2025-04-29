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

export interface dbTwitch {
    twitch_channel_id: string;
    is_live: boolean;
}

export type dbDiscordTable = {
    guild_id: string;
    guild_channel_id: string;
    guild_platform: string;
    platform_user_id: string;
    guild_ping_role: null | string;
};
