export interface dbYouTube {
    channelId: string;
    lastVideoId: string;
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
