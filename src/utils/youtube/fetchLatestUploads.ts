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
import getSinglePlaylistAndReturnVideoData, {
    PlaylistType,
} from "./getSinglePlaylistAndReturnVideoData";

/**
 * Parse an ISO 8601 duration string (e.g. "PT1H2M3S") into total seconds.
 */
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch the duration (in seconds) of a video using the YouTube Videos API.
 * Returns 0 if the duration cannot be determined.
 */
async function fetchVideoDuration(videoId: string): Promise<number> {
    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${env.youtubeApiKey}`,
    );

    if (!res.ok) {
        console.error(
            "Error fetching video duration:",
            res.statusText,
        );
        return 0;
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) return 0;

    return parseISO8601Duration(data.items[0].contentDetails.duration);
}

export const updates = new Map<
    string,
    {
        channelInfo: Awaited<ReturnType<typeof getChannelDetails>>;
        discordGuildsToUpdate: (typeof dbGuildYouTubeSubscriptionsTable.$inferSelect)[];
    }
>();

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
            const videoId =
                playlist.snippet.thumbnails.default.url.split("/")[4];

            if (!channelDict[channelId]) {
                console.error(
                    "Channel ID not found in channelDict:",
                    channelId,
                );
                continue;
            }

            const requiresUpdate =
                channelDict[channelId].latestAllId !== videoId;

            if (requiresUpdate) {
                console.log(
                    "Channel ID:",
                    channelId,
                    "Video ID:",
                    videoId,
                    "Requires update?",
                    requiresUpdate,
                );
                // Use duration-based detection to reduce API quota usage
                // and avoid UULF which is currently lagging
                const durationSeconds = await fetchVideoDuration(videoId);
                const THREE_MINUTES = 180;

                let contentType: PlaylistType | null = null;

                if (durationSeconds >= THREE_MINUTES) {
                    // Over 3 minutes: cannot be a short, check only if it's a stream
                    const streamVideoId = await getSinglePlaylistAndReturnVideoData(
                        channelId,
                        PlaylistType.Stream,
                    );

                    if (videoId === streamVideoId.videoId) {
                        contentType = PlaylistType.Stream;
                    } else {
                        // Not a stream and over 3 min; must be a regular video
                        contentType = PlaylistType.Video;
                    }
                } else {
                    // Under 3 minutes: could be a short or a video, check UUSH and UULV
                    const [shortVideoId, streamVideoId] = await Promise.all([
                        getSinglePlaylistAndReturnVideoData(
                            channelId,
                            PlaylistType.Short,
                        ),
                        getSinglePlaylistAndReturnVideoData(
                            channelId,
                            PlaylistType.Stream,
                        ),
                    ]);

                    if (videoId === shortVideoId.videoId) {
                        contentType = PlaylistType.Short;
                    } else if (videoId === streamVideoId.videoId) {
                        contentType = PlaylistType.Stream;
                    } else {
                        // Not in shorts or streams playlist → regular video
                        contentType = PlaylistType.Video;
                    }
                }

                console.log("Determined content type:", contentType, `(duration: ${durationSeconds}s)`);

                if (contentType) {
                    console.log(
                        `Updating ${contentType} video ID for channel`,
                        channelId,
                        "to",
                        videoId,
                    );
                } else {
                    console.error(
                        "No valid video ID found for channel",
                        channelId,
                        "with video ID",
                        videoId,
                    );
                    continue;
                }

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
