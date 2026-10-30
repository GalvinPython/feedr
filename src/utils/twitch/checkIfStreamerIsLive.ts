import { env } from "../../config";
import client from "../../client";
import { dbAuditLogCreate } from "../../db/audit";
import {
    dbTwitchGetAllChannelsToTrack,
    twitchUpdateIsLive,
} from "../../db/twitch";
import { discordGetAllGuildsTrackingChannel } from "../../db/discord";
import { Platform } from "../../types/types.d";

import { twitchToken, twitchFetch } from "./auth";
import { getStreamerName } from "./getStreamerName";

export async function checkIfStreamerIsLive(
    streamerId: string,
): Promise<boolean> {
    if (!twitchToken || !env.twitchClientId) {
        console.error("Twitch token not found in checkIfStreamerIsLive");

        return false;
    }

    const res = await twitchFetch(
        `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
    );

    if (!res.ok) {
        console.error(
            "Error fetching stream data in checkIfStreamerIsLive:",
            res.statusText,
        );

        return false;
    }

    const data = await res.json();

    console.log("Stream data:", data);

    return data.data.length > 0;
}

let isCheckingTwitch = false;

export async function checkIfStreamersAreLive(): Promise<void> {
    if (isCheckingTwitch) return;
    isCheckingTwitch = true;
    try {
        if (!twitchToken || !env.twitchClientId) {
            console.error("Twitch token not found in checkIfStreamersAreLive");

            return;
        }

        const allStreamerIds = await dbTwitchGetAllChannelsToTrack();
        const chunkSize = 100;
        const chunks = [];

        for (let i = 0; i < allStreamerIds.data.length; i += chunkSize) {
            const chunk = allStreamerIds.data.slice(i, i + chunkSize);

            chunks.push(chunk);
        }

        for (const chunk of chunks) {
            const urlQueries = chunk
                .map((streamerId) => `user_id=${streamerId.twitchChannelId}`)
                .join("&");
            const res = await twitchFetch(
                `https://api.twitch.tv/helix/streams?first=100&${urlQueries}`,
            );

            if (!res.ok) {
                console.error(
                    "Error fetching stream data in checkIfStreamersAreLive:",
                    res.statusText,
                );

                continue;
            }

            const data = await res.json();
            const allLiveStreamers = data.data.map(
                (stream: any) => stream.user_id,
            );

            for (const streamerId of chunk) {
                const isLive = allLiveStreamers.includes(
                    streamerId.twitchChannelId,
                );
                const needsUpdate =
                    isLive !== Boolean(streamerId.twitchChannelIsLive);

                console.log(
                    `[Twitch] ${streamerId.twitchChannelId} is live:`,
                    isLive,
                    ". Was live:",
                    Boolean(streamerId.twitchChannelIsLive),
                    ". Needs update:",
                    needsUpdate,
                );

                if (needsUpdate) {
                    const guildsTrackingStreamer = isLive
                        ? await discordGetAllGuildsTrackingChannel(
                              Platform.Twitch,
                              streamerId.twitchChannelId,
                          )
                        : null;

                    if (
                        guildsTrackingStreamer &&
                        !guildsTrackingStreamer.success
                    )
                        continue;
                    // Update the database
                    console.log(
                        `Updating ${streamerId.twitchChannelId} to be ${isLive ? "live" : "offline"}`,
                    );
                    const updated = await twitchUpdateIsLive(
                        streamerId.twitchChannelId,
                        isLive,
                    );

                    if (!updated.success || !updated.data) continue;

                    if (isLive) {
                        // Get the streamer's name
                        const streamerName =
                            (await getStreamerName(
                                streamerId.twitchChannelId,
                            )) ?? streamerId.twitchChannelName;

                        for (const guild of guildsTrackingStreamer?.data ??
                            []) {
                            const auditData = {
                                platform: "twitch",
                                twitchChannelId: streamerId.twitchChannelId,
                                streamerName,
                                notificationChannelId:
                                    guild.notificationChannelId,
                                isDm: guild.isDm,
                            };

                            try {
                                const channel = await client.channels.fetch(
                                    guild.notificationChannelId,
                                );

                                if (!channel?.isSendable())
                                    throw new Error("Channel is not sendable");
                                await channel.send({
                                    content: `${guild.notificationRoleId ? `<@&${guild.notificationRoleId}>` : ""} ${streamerName} is now live <https://twitch.tv/${streamerName}>!`,
                                    allowedMentions: {
                                        parse: [],
                                        roles: guild.notificationRoleId
                                            ? [guild.notificationRoleId]
                                            : [],
                                    },
                                });
                                await dbAuditLogCreate(
                                    guild.guildId,
                                    "notification_sent",
                                    "success",
                                    auditData,
                                );
                            } catch (error) {
                                console.error(
                                    "Error sending Twitch notification:",
                                    error,
                                );
                                await dbAuditLogCreate(
                                    guild.guildId,
                                    "notification_sent",
                                    "failure",
                                    { ...auditData, error: String(error) },
                                );
                            }
                        }
                    } else {
                        console.log(
                            `[Twitch] ${streamerId.twitchChannelId} is offline!`,
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error polling Twitch:", error);
    } finally {
        isCheckingTwitch = false;
    }
}
