import type { TextChannel } from "discord.js";

import { env } from "../../config";
import client from "../../client";
import {
    dbTwitchGetAllChannelsToTrack,
    twitchUpdateIsLive,
} from "../../db/twitch";
import { discordGetAllGuildsTrackingChannel } from "../../db/discord";
import { Platform } from "../../types/types.d";

import { twitchToken } from "./auth";
import { getStreamerName } from "./getStreamerName";

export async function checkIfStreamerIsLive(
    streamerId: string,
): Promise<boolean> {
    if (!twitchToken || !env.twitchClientId) {
        console.error("Twitch token not found in checkIfStreamerIsLive");

        return false;
    }

    const res = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
        {
            headers: {
                "Client-ID": env.twitchClientId,
                Authorization: `Bearer ${twitchToken}`,
            },
        },
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

export async function checkIfStreamersAreLive(): Promise<void> {
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
        const res = await fetch(
            `https://api.twitch.tv/helix/streams?${urlQueries}`,
            {
                headers: {
                    "Client-ID": env.twitchClientId,
                    Authorization: `Bearer ${twitchToken}`,
                },
            },
        );

        if (!res.ok) {
            console.error(
                "Error fetching stream data in checkIfStreamersAreLive:",
                res.statusText,
            );

            return;
        }

        const data = await res.json();
        const allLiveStreamers = data.data.map((stream: any) => stream.user_id);

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
                // Update the database
                console.log(
                    `Updating ${streamerId.twitchChannelId} to be ${isLive ? "live" : "offline"}`,
                );
                await twitchUpdateIsLive(streamerId.twitchChannelId, isLive);

                if (isLive) {
                    // Get the streamer's name
                    const streamerName = await getStreamerName(
                        streamerId.twitchChannelId,
                    );

                    // Get all guilds that are tracking this streamer
                    const guildsTrackingStreamer =
                        await discordGetAllGuildsTrackingChannel(
                            Platform.Twitch,
                            streamerId.twitchChannelId,
                        );

                    for (const guild of guildsTrackingStreamer.data) {
                        // Send a message to the channel
                        const channel = await client.channels.fetch(
                            guild.notificationChannelId,
                        );

                        await (channel as TextChannel).send(
                            `${guild.notificationRoleId ? `<@&${guild.notificationRoleId}>` : ""} ${streamerName} is now live <https://twitch.tv/${streamerName}>!`,
                        );
                    }
                } else {
                    console.log(
                        `[Twitch] ${streamerId.twitchChannelId} is offline!`,
                    );
                }
            }
        }
    }
}
