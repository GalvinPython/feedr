import { eq, sql } from "drizzle-orm";

import getSinglePlaylistAndReturnVideoId, {
    PlaylistType,
    getAllUploadIds,
} from "../utils/youtube/getSinglePlaylistAndReturnVideoData";
import getChannelDetails from "../utils/youtube/getChannelDetails";

import { dbYouTubeTable } from "./schema";
import { db } from "./db";

// Get all the YouTube channels that are being tracked
export async function dbYouTubeGetAllChannelsToTrack(): Promise<{
    success: boolean;
    data: (typeof dbYouTubeTable.$inferSelect)[];
}> {
    try {
        const result = await db
            .select()
            .from(dbYouTubeTable)
            .where(eq(dbYouTubeTable.isActive, true));

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

        const uploadIds = await getAllUploadIds(channelId);
        const previousVideoIds = [
            ...new Set(
                [
                    ...uploadIds,
                    latestId?.videoId,
                    longId?.videoId,
                    shortId?.videoId,
                    liveId?.videoId,
                ].filter((id): id is string => Boolean(id)),
            ),
        ];

        const channelData = {
            youtubeChannelId: channelId,
            isActive: false,
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
            previousVideoIds,
            videoHistoryInitialized: true,
        };

        await db
            .insert(dbYouTubeTable)
            .values(channelData)
            .onConflictDoUpdate({
                target: dbYouTubeTable.youtubeChannelId,
                set: {
                    ...channelData,
                    previousVideoIds: sql`ARRAY(SELECT DISTINCT id FROM unnest(${dbYouTubeTable.previousVideoIds} || ARRAY[${sql.join(
                        previousVideoIds.map((id) => sql`${id}`),
                        sql`, `,
                    )}]::text[] || ARRAY[${dbYouTubeTable.latestAllId}, ${dbYouTubeTable.latestVideoId}, ${dbYouTubeTable.latestShortId}, ${dbYouTubeTable.latestStreamId}]) AS id WHERE id IS NOT NULL)`,
                    latestAllId: sql`coalesce(${channelData.latestAllId}, ${dbYouTubeTable.latestAllId})`,
                    latestVideoId: sql`coalesce(${channelData.latestVideoId}, ${dbYouTubeTable.latestVideoId})`,
                    latestShortId: sql`coalesce(${channelData.latestShortId}, ${dbYouTubeTable.latestShortId})`,
                    latestStreamId: sql`coalesce(${channelData.latestStreamId}, ${dbYouTubeTable.latestStreamId})`,
                    latestVideoIdUpdated: sql`coalesce(${channelData.latestVideoIdUpdated}, ${dbYouTubeTable.latestVideoIdUpdated})`,
                    latestShortIdUpdated: sql`coalesce(${channelData.latestShortIdUpdated}, ${dbYouTubeTable.latestShortIdUpdated})`,
                    latestStreamIdUpdated: sql`coalesce(${channelData.latestStreamIdUpdated}, ${dbYouTubeTable.latestStreamIdUpdated})`,
                },
                setWhere: eq(dbYouTubeTable.isActive, false),
            });

        console.log("Channel added to track successfully:", channelId);

        return { success: true, data: [] };
    } catch (err) {
        console.error("Error adding channel to track:", err);

        return { success: false, data: [] };
    }
}

export async function seedChannelVideoHistory(
    channelId: string,
): Promise<typeof dbYouTubeTable.$inferSelect | undefined> {
    const ids = await getAllUploadIds(channelId);
    const [updated] = await db
        .update(dbYouTubeTable)
        .set({
            previousVideoIds: sql`ARRAY(SELECT DISTINCT id FROM unnest(${dbYouTubeTable.previousVideoIds} || ARRAY[${sql.join(
                ids.map((id) => sql`${id}`),
                sql`, `,
            )}]::text[] || ARRAY[${dbYouTubeTable.latestAllId}, ${dbYouTubeTable.latestVideoId}, ${dbYouTubeTable.latestShortId}, ${dbYouTubeTable.latestStreamId}]) AS id WHERE id IS NOT NULL)`,
            videoHistoryInitialized: true,
        })
        .where(eq(dbYouTubeTable.youtubeChannelId, channelId))
        .returning();

    return updated;
}

// Update the latest video ID for a channel
export async function youtubeUpdateVideoId(
    channelId: string,
    videoId: string,
    contentType: PlaylistType,
    updateTime: Date,
): Promise<{ success: boolean; data?: typeof dbYouTubeTable.$inferSelect }> {
    try {
        const updateData: Partial<typeof dbYouTubeTable.$inferInsert> = {
            latestAllId: videoId,
        };

        switch (contentType) {
            case PlaylistType.Video:
                updateData.latestVideoId = videoId;
                updateData.latestVideoIdUpdated = updateTime;
                break;
            case PlaylistType.Short:
                updateData.latestShortId = videoId;
                updateData.latestShortIdUpdated = updateTime;
                break;
            case PlaylistType.Stream:
                updateData.latestStreamId = videoId;
                updateData.latestStreamIdUpdated = updateTime;
                break;
            case PlaylistType.All:
                break;
            default:
                break;
        }

        // Always update the "all" column regardless of the content type
        updateData.latestAllId = videoId;

        const [updated] = await db
            .update(dbYouTubeTable)
            .set({
                ...updateData,
                previousVideoIds: sql`ARRAY(SELECT DISTINCT id FROM unnest(${dbYouTubeTable.previousVideoIds} || ARRAY[${videoId}, ${dbYouTubeTable.latestAllId}, ${dbYouTubeTable.latestVideoId}, ${dbYouTubeTable.latestShortId}, ${dbYouTubeTable.latestStreamId}]::text[]) AS id WHERE id IS NOT NULL)`,
            })
            .where(eq(dbYouTubeTable.youtubeChannelId, channelId))
            .returning();

        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating YouTube video ID:", error);

        return { success: false };
    }
}
