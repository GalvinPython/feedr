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

            const requiresUpdate =
                channelDict[channelId].latestAllId !== videoId;

            console.log(
                "Channel ID:",
                channelId,
                "Video ID:",
                videoId,
                "Requires update?",
                requiresUpdate,
            );

            if (requiresUpdate) {
                const [longVideoId, shortVideoId, streamVideoId] =
                    await Promise.all([
                        getSinglePlaylistAndReturnVideoData(
                            channelId,
                            PlaylistType.Video,
                        ),
                        getSinglePlaylistAndReturnVideoData(
                            channelId,
                            PlaylistType.Short,
                        ),
                        getSinglePlaylistAndReturnVideoData(
                            channelId,
                            PlaylistType.Stream,
                        ),
                    ]);

                if (!longVideoId && !shortVideoId && !streamVideoId) {
                    console.error(
                        "No video IDs found for channel in fetchLatestUploads",
                    );
                    continue;
                }

                let contentType: PlaylistType | null = null;

                const videoIdMap = {
                    [PlaylistType.Video]: longVideoId,
                    [PlaylistType.Short]: shortVideoId,
                    [PlaylistType.Stream]: streamVideoId,
                };

                contentType = Object.entries(videoIdMap).find(
                    ([, id]) => id,
                )?.[0] as PlaylistType | null;

                if (contentType) {
                    console.log(
                        `Updating ${contentType} video ID for channel`,
                        channelId,
                        "to",
                        videoIdMap[contentType as keyof typeof videoIdMap],
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

                if (!updateSuccess) {
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

                console.log(
                    discordGuildsToUpdate.data.filter(
                        (
                            guild,
                        ): guild is typeof dbGuildYouTubeSubscriptionsTable.$inferSelect =>
                            "youtubeChannelId" in guild &&
                            "trackVideos" in guild &&
                            "trackShorts" in guild &&
                            "trackStreams" in guild,
                    ),
                );

                updates.set(videoId, {
                    channelInfo,
                    discordGuildsToUpdate: discordGuildsToUpdate.data.filter(
                        (
                            guild,
                        ): guild is typeof dbGuildYouTubeSubscriptionsTable.$inferSelect =>
                            "youtubeChannelId" in guild &&
                            "trackVideos" in guild &&
                            "trackShorts" in guild &&
                            "trackStreams" in guild,
                    ),
                });

                // console.log("Discord guilds to update:", discordGuildsToUpdate);
                // for (const guild of discordGuildsToUpdate) {
                //     try {
                //         const channelObj = await client.channels.fetch(
                //             guild.guild_channel_id,
                //         );

                //         if (
                //             !channelObj ||
                //             (channelObj.type !== ChannelType.GuildText &&
                //                 channelObj.type !==
                //                     ChannelType.GuildAnnouncement)
                //         ) {
                //             console.error(
                //                 "Invalid channel or not a text channel in fetchLatestUploads",
                //             );
                //             continue;
                //         }

                //         await (channelObj as TextChannel).send({
                //             content:
                //                 guild.guild_ping_role && channelInfo
                //                     ? `<@&${guild.guild_ping_role}> New video uploaded for ${channelInfo?.channelName}! https://www.youtube.com/watch?v=${videoId}`
                //                     : guild.guild_ping_role
                //                       ? `<@&${guild.guild_ping_role}> New video uploaded! https://www.youtube.com/watch?v=${videoId}`
                //                       : channelInfo
                //                         ? `New video uploaded for ${channelInfo.channelName}! https://www.youtube.com/watch?v=${videoId}`
                //                         : `New video uploaded! https://www.youtube.com/watch?v=${videoId}`,
                //         });
                //     } catch (error) {
                //         console.error(
                //             "Error fetching or sending message to channel in fetchLatestUploads:",
                //             error,
                //         );
                //     }
                // }
            }
        }
    }
}
