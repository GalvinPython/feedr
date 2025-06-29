import type { dbYouTube } from "../../types/database";

import { pool } from "../database";
import getSinglePlaylistAndReturnVideoId, {
    PlaylistType,
} from "../youtube/getSinglePlaylistAndReturnVideoData";

export async function dbYouTubeGetAllChannelsToTrack(): Promise<
    dbYouTube[] | []
> {
    const query = `SELECT * FROM youtube`;

    try {
        const client = await pool.connect();
        const result = await client.query(query);

        client.release();

        return result.rows as dbYouTube[];
    } catch (err) {
        console.error("Error getting all channels to track:", err);

        return [];
    }
}

// These two functions are for checking/adding a new channel to the youtube table
export async function checkIfChannelIsAlreadyTracked(
    channelId: string,
): Promise<boolean> {
    const query = `SELECT * FROM youtube WHERE youtube_channel_id = ?`;

    try {
        const client = await pool.connect();
        const result = await client.query(query, [channelId]);

        return result.rows.length > 0;
    } catch (err) {
        console.error("Error checking if channel is already tracked:", err);

        // Return true if there's an error as we don't want to add the channel if we can't check it
        return true;
    }
}

// Before adding a new channel, we need to get the latest video, short and stream ID
export async function addNewChannelToTrack(
    channelId: string,
): Promise<boolean> {
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

    const query = `INSERT INTO youtube (youtube_channel_id, latest_video_id_updated, latest_video_id, latest_short_id, latest_short_id_updated, latest_stream_id, latest_stream_id_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        const client = await pool.connect();

        await client.query(query, [
            channelId,
            longId?.videoId || null,
            longId?.datePublished || null,
            shortId?.videoId || null,
            shortId?.datePublished || null,
            liveId?.videoId || null,
            liveId?.datePublished || null,
        ]);

        return true;
    } catch (err) {
        console.error("Error adding channel to track:", err);

        return false;
    }
}
