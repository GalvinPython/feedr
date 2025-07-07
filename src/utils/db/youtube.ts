import type { dbYouTube } from "../../types/database";

import { pool } from "../database";
import getSinglePlaylistAndReturnVideoId, {
    PlaylistType,
} from "../youtube/getSinglePlaylistAndReturnVideoData";

export async function dbYouTubeGetAllChannelsToTrack(): Promise<{
    success: boolean;
    data: dbYouTube[] | [];
}> {
    const query = `SELECT * FROM youtube`;

    try {
        const client = await pool.connect();
        const result = await client.query(query);

        client.release();

        return {
            success: true,
            data: result.rows as dbYouTube[],
        };
    } catch (err) {
        console.error("Error getting all channels to track:", err);

        return {
            success: false,
            data: [],
        };
    }
}

// These two functions are for checking/adding a new channel to the youtube table
export async function checkIfChannelIsAlreadyTracked(
    channelId: string,
): Promise<{ success: boolean; data: dbYouTube[] | [] }> {
    const query = `SELECT * FROM youtube WHERE youtube_channel_id = $1`;

    try {
        const client = await pool.connect();
        const result = await client.query(query, [channelId]);

        client.release();

        return {
            success: true,
            data: result.rows as dbYouTube[],
        };
    } catch (err) {
        console.error("Error checking if channel is already tracked:", err);

        return {
            success: false,
            data: [],
        };
    }
}

// Before adding a new channel, we need to get the latest video, short and stream ID
export async function addNewChannelToTrack(
    channelId: string,
): Promise<{ success: boolean; data: [] }> {
    console.log("Adding channel to track:", channelId);

    const longId = await getSinglePlaylistAndReturnVideoId(
        channelId,
        PlaylistType.Video,
    );
    const shortId = await getSinglePlaylistAndReturnVideoId(
        channelId,
        PlaylistType.Short,
    );
    const liveId = await getSinglePlaylistAndReturnVideoId(
        channelId,
        PlaylistType.Stream,
    );

    const query = `INSERT INTO youtube (youtube_channel_id, latest_video_id, latest_video_id_updated, latest_short_id, latest_short_id_updated, latest_stream_id, latest_stream_id_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)`;

    try {
        const client = await pool.connect();

        console.log(
            channelId,
            longId?.videoId,
            longId?.datePublished,
            shortId?.videoId,
            shortId?.datePublished,
            liveId?.videoId,
            liveId?.datePublished,
        );
        await client.query(query, [
            channelId,
            longId?.videoId || null,
            longId?.datePublished ? longId.datePublished : null,
            shortId?.videoId || null,
            shortId?.datePublished ? shortId.datePublished : null,
            liveId?.videoId || null,
            liveId?.datePublished ? liveId.datePublished : null,
        ]);

        client.release();

        console.log("Channel added to track successfully:", channelId);

        return { success: true, data: [] };
    } catch (err) {
        console.error("Error adding channel to track:", err);

        return { success: false, data: [] };
    }
}
