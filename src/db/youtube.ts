import { eq } from "drizzle-orm";

import getSinglePlaylistAndReturnVideoId, {
    PlaylistType,
} from "../utils/youtube/getSinglePlaylistAndReturnVideoData";
import getChannelDetails from "../utils/youtube/getChannelDetails";

import { dbYouTubeTable } from "./schema";
import { db } from "./db";

export async function dbYouTubeGetAllChannelsToTrack(): Promise<{
    success: boolean;
    data: (typeof dbYouTubeTable.$inferSelect)[];
}> {
    try {
        const result = await db.select().from(dbYouTubeTable);

        return {
            success: true,
            data: result,
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
): Promise<{ success: boolean; data: (typeof dbYouTubeTable.$inferSelect)[] }> {
    try {
        const result = await db
            .select()
            .from(dbYouTubeTable)
            .where(eq(dbYouTubeTable.youtubeChannelId, channelId));

        return {
            success: true,
            data: result,
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

    try {
        const channelDetails = await getChannelDetails(channelId);

        const latestId = await getSinglePlaylistAndReturnVideoId(
            channelId,
            PlaylistType.All,
        );
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

        await db.insert(dbYouTubeTable).values({
            youtubeChannelId: channelId,
            youtubeChannelName: channelDetails?.channelName ?? "",
            latestAllId: latestId?.videoId ?? null,
            latestVideoId: longId?.videoId ?? null,
            latestVideoIdUpdated: longId?.datePublished ?? null,
            latestShortId: shortId?.videoId ?? null,
            latestShortIdUpdated: shortId?.datePublished ?? null,
            latestStreamId: liveId?.videoId ?? null,
            latestStreamIdUpdated: liveId?.datePublished ?? null,
            // TODO: Add better streaming capabilities in the future
            youtubeChannelIsLive: false,
            youtubeLiveIds: [],
        });

        console.log("Channel added to track successfully:", channelId);

        return { success: true, data: [] };
    } catch (err) {
        console.error("Error adding channel to track:", err);

        return { success: false, data: [] };
    }
}
