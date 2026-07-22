import type { YouTubePlaylistResponse } from "../../types/youtube";

import { Platform } from "../../types/types.d";
import {
    dbGuildYouTubeSubscriptionsTable,
    dbYouTubeTable,
} from "../../db/schema";
import { env } from "../../config";
import {
    dbYouTubeGetAllChannelsToTrack,
    youtubeUpdateVideoId,
} from "../../db/youtube";
import { discordGetAllGuildsTrackingChannel } from "../../db/discord";

import getChannelDetails from "./getChannelDetails";
import { PlaylistType } from "./getSinglePlaylistAndReturnVideoData";

export const updates = new Map<
    string,
    {
        channelInfo: Awaited<ReturnType<typeof getChannelDetails>>;
        discordGuildsToUpdate: (typeof dbGuildYouTubeSubscriptionsTable.$inferSelect)[];
    }
>();

async function fetchUnseenUploadVideoIds(
    channelId: string,
    latestKnownVideoId: string,
): Promise<string[]> {
    const uploadPlaylistId = `UU${channelId.slice(2)}`;
    const unseenVideoIds: string[] = [];
    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadPlaylistId}&key=${env.youtubeApiKey}`,
    );

    if (!res.ok) {
        console.error(
            "Error fetching upload playlist items in fetchLatestUploads:",
            res.statusText,
        );
        return unseenVideoIds;
    }

    const data = (await res.json()) as YouTubePlaylistResponse;

    if (!data.items || data.items.length === 0) {
        return unseenVideoIds;
    }

    for (const item of data.items) {
        const unseenVideoId = item?.snippet?.resourceId?.videoId;

        if (!unseenVideoId) {
            continue;
        }

        if (unseenVideoId === latestKnownVideoId) {
            break;
        }

        unseenVideoIds.push(unseenVideoId);
    }

    return unseenVideoIds;
}

async function fetchPlaylistVideoIds(
    channelId: string,
    playlistType: PlaylistType.Short | PlaylistType.Stream,
): Promise<Set<string>> {
    const playlistPrefix =
        playlistType === PlaylistType.Short ? "UUSH" : "UULV";
    const playlistId = `${playlistPrefix}${channelId.slice(2)}`;
    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${env.youtubeApiKey}`,
    );

    if (!res.ok) {
        console.error(
            `Error fetching ${playlistType} playlist items in fetchLatestUploads:`,
            res.statusText,
        );
        return new Set();
    }

    const data = (await res.json()) as YouTubePlaylistResponse;

    if (!data.items || data.items.length === 0) {
        return new Set();
    }

    return new Set(
        data.items
            .map((item) => item?.snippet?.resourceId?.videoId)
            .filter((videoId): videoId is string => typeof videoId === "string"),
    );
}

export default async function fetchLatestUploads() {
    console.log("Fetching latest uploads...");

    const channels = await dbYouTubeGetAllChannelsToTrack();
    const channelDict: Record<string, typeof dbYouTubeTable.$inferSelect> = {};

    if (!channels || !channels.success || channels.data.length === 0) {
        console.log("No channels to track.");

        return;
    }

    channels.data.forEach((channel) => {
        if (!channel.youtubeChannelId) {
            console.error("Channel ID is missing in fetchLatestUploads");

            return;
        }
        channelDict[channel.youtubeChannelId] = channel;
    });

    const chunkSize = 50;
    const channelIds = Object.keys(channelDict).map((channelId) =>
        channelId.replace(/^UC/, "UU"),
    );
    const chunks: string[][] = [];

    for (let i = 0; i < channelIds.length; i += chunkSize) {
        const chunk = channelIds.slice(i, i + chunkSize);

        chunks.push(chunk);
    }

    for (const chunk of chunks) {
        const chunkJoined = chunk.join(",");
        const res = await fetch(
            `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${chunkJoined}&key=${env.youtubeApiKey}`,
        );

        if (!res.ok) {
            console.error(
                "Error fetching latest uploads in fetchLatestUploads:",
                res.statusText,
            );

            return;
        }

        const data = await res.json();

        // TODO: Upload time (https://github.com/GalvinPython/feedr/issues/136)
        for (const playlist of data.items) {
            const channelId = playlist.snippet.channelId;
            const latestVideoId =
                playlist.snippet.thumbnails.default.url.split("/")[4];

            if (!channelDict[channelId]) {
                console.error(
                    "Channel ID not found in channelDict:",
                    channelId,
                );
                continue;
            }

            const latestKnownVideoId = channelDict[channelId].latestAllId;
            const requiresUpdate = latestKnownVideoId !== latestVideoId;

            if (requiresUpdate) {
                console.log(
                    "Channel ID:",
                    channelId,
                    "Video ID:",
                    latestVideoId,
                    "Requires update?",
                    requiresUpdate,
                );
                let videosToProcess = [latestVideoId];

                if (latestKnownVideoId) {
                    const unseenVideoIds = await fetchUnseenUploadVideoIds(
                        channelId,
                        latestKnownVideoId,
                    );

                    if (unseenVideoIds.length > 0) {
                        // Process oldest to newest so notifications preserve upload order.
                        videosToProcess = unseenVideoIds.reverse();
                    }
                }

                const discordGuildsToUpdate =
                    await discordGetAllGuildsTrackingChannel(
                        Platform.YouTube,
                        channelId,
                    );

                if (!discordGuildsToUpdate) {
                    console.error(
                        "Error getting discord guilds to update in fetchLatestUploads",
                    );

                    return;
                }

                const channelInfo = await getChannelDetails(channelId);
                const [shortVideoIds, streamVideoIds] = await Promise.all([
                    fetchPlaylistVideoIds(channelId, PlaylistType.Short),
                    fetchPlaylistVideoIds(channelId, PlaylistType.Stream),
                ]);

                for (const videoId of videosToProcess) {
                    let contentType = PlaylistType.Video;

                    if (shortVideoIds.has(videoId)) {
                        contentType = PlaylistType.Short;
                    } else if (streamVideoIds.has(videoId)) {
                        contentType = PlaylistType.Stream;
                    } else {
                        contentType = PlaylistType.Video;
                    }

                    console.log("Determined content type:", contentType);

                    const updateSuccess = await youtubeUpdateVideoId(
                        channelId,
                        videoId,
                        contentType,

                        // Temporarily using current date for update time
                        new Date(),
                    );

                    if (!updateSuccess.success) {
                        console.error(
                            "Error updating video ID in fetchLatestUploads",
                        );

                        return;
                    }

                    console.info(`Filtered guilds for channel ID ${channelId}:`, {
                        count: discordGuildsToUpdate.data.filter(
                            (
                                guild,
                            ): guild is typeof dbGuildYouTubeSubscriptionsTable.$inferSelect =>
                                "youtubeChannelId" in guild &&
                                "trackVideos" in guild &&
                                "trackShorts" in guild &&
                                "trackStreams" in guild,
                        ).length,
                    });

                    updates.set(videoId, {
                        channelInfo,
                        discordGuildsToUpdate: discordGuildsToUpdate.data.filter(
                            (
                                guild,
                            ): guild is typeof dbGuildYouTubeSubscriptionsTable.$inferSelect =>
                                "youtubeChannelId" in guild &&
                                ((contentType === PlaylistType.Video &&
                                    guild.trackVideos) ||
                                    (contentType === PlaylistType.Short &&
                                        guild.trackShorts) ||
                                    (contentType === PlaylistType.Stream &&
                                        guild.trackStreams)),
                        ),
                    });
                }
            }
        }
    }
}
