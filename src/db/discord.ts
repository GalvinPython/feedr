import { Platform } from "../types/types";
import { pool } from "../utils/database";

export async function checkIfGuildIsTrackingUserAlready(
    platform: Platform,
    userId: string,
    guildId: string,
): Promise<{ success: boolean; data: any[] | null }> {
    console.log(
        `Checking if guild ${guildId} is tracking user ${userId} on platform ${platform}`,
    );

    let query: string | null = null;

    if (platform === Platform.YouTube) {
        query = `
            SELECT * FROM guild_youtube_subscriptions
            WHERE youtube_channel_id = $1 AND guild_id = $2
        `;
    } else if (platform === Platform.Twitch) {
        query = `
            SELECT * FROM guild_twitch_subscriptions
            WHERE twitch_user_id = $1 AND guild_id = $2
        `;
    }

    if (!query) {
        console.error("Invalid platform provided for tracking check.");

        return { success: false, data: null };
    }

    try {
        const client = await pool.connect();
        const result = await client.query(query, [userId, guildId]);

        client.release();

        if (result.rows.length > 0) {
            return { success: true, data: result.rows };
        } else {
            return { success: true, data: null };
        }
    } catch (error) {
        console.error("Error checking if guild is tracking user:", error);

        return { success: false, data: null };
    }
}

export async function discordAddGuildTrackingUser(
    guildId: string,
    platform: Platform,
    platformUserId: string,
    guildChannelId: string,
    roleId: string | null,
    isDm: boolean,

    // YouTube specific tracking options
    youtubeTrackVideos?: boolean | null,
    youtubeTrackShorts?: boolean | null,
    youtubeTrackLive?: boolean | null,
): Promise<{ success: boolean; data: [] }> {
    console.log(
        `Adding guild ${guildId} tracking for user ${platformUserId} on platform ${platform}`,
    );

    let query: string | null = null;
    let params: any[] = [];

    if (platform === Platform.YouTube) {
        if (
            youtubeTrackVideos === undefined ||
            youtubeTrackVideos === null ||
            youtubeTrackShorts === undefined ||
            youtubeTrackShorts === null ||
            youtubeTrackLive === undefined ||
            youtubeTrackLive === null
        ) {
            console.error(
                "YouTube tracking options must be provided for YouTube subscriptions.",
            );

            return { success: false, data: [] };
        }

        query = `
            INSERT INTO guild_youtube_subscriptions (
                youtube_channel_id, guild_id, notification_channel_id, notification_role_id, is_dm,
                track_videos, track_shorts, track_streams
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        params = [
            platformUserId,
            guildId,
            guildChannelId,
            roleId,
            isDm,
            youtubeTrackVideos ?? false,
            youtubeTrackShorts ?? false,
            youtubeTrackLive ?? false,
        ];
    } else if (platform === Platform.Twitch) {
        query = `
            INSERT INTO guild_twitch_subscriptions (
                twitch_channel_id, guild_id, notification_channel_id, notification_role_id, is_dm
            ) VALUES ($1, $2, $3, $4, $5)
        `;
        params = [platformUserId, guildId, guildChannelId, roleId, isDm];
    }

    if (!query) {
        return { success: false, data: [] };
    }

    try {
        const client = await pool.connect();

        await client.query(query, params);
        client.release();

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error adding guild tracking user:", error);

        return { success: false, data: [] };
    }
}
