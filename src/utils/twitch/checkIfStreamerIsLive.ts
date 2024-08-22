import { twitchToken } from "./auth";
import { env } from "../../config";
import { twitchGetAllChannelsToTrack, twitchGetGuildsTrackingChannel, twitchUpdateIsLive } from "../../database";
import type { dbTwitch } from "../../types/database";
import client from "../..";
import type { TextChannel } from "discord.js";
import { getStreamerName } from "./getStreamerName";

export async function checkIfStreamerIsLive(streamerId: string): Promise<boolean> {
	if (!twitchToken || !env.twitchClientId) {
		console.error("Twitch token not found in checkIfStreamerIsLive");
		return false;
	}

	const res = await fetch(`https://api.twitch.tv/helix/streams?user_id=${streamerId}`, {
		headers: {
			'Client-ID': env.twitchClientId,
			'Authorization': `Bearer ${twitchToken}`,
		},
	});

	if (!res.ok) {
		console.error("Error fetching stream data in checkIfStreamerIsLive:", res.statusText);
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

	const allStreamerIds = await twitchGetAllChannelsToTrack();
	const chunkSize = 100;
	const chunks = [];

	for (let i = 0; i < allStreamerIds.length; i += chunkSize) {
		const chunk = allStreamerIds.slice(i, i + chunkSize);
		chunks.push(chunk);
	}

	for (const chunk of chunks) {
		const urlQueries = chunk.map((streamerId: dbTwitch) => `user_id=${streamerId.twitch_channel_id}`).join("&");
		const res = await fetch(`https://api.twitch.tv/helix/streams?${urlQueries}`, {
			headers: {
				'Client-ID': env.twitchClientId,
				'Authorization': `Bearer ${twitchToken}`,
			},
		});

		if (!res.ok) {
			console.error("Error fetching stream data in checkIfStreamersAreLive:", res.statusText);
			return;
		}

		const data = await res.json();
		const allLiveStreamers = data.data.map((stream: any) => stream.user_id);

		for (const streamerId of chunk) {
			const isLive = allLiveStreamers.includes(streamerId.twitch_channel_id);
			const needsUpdate = isLive !== Boolean(streamerId.is_live);

			console.log(`[Twitch] ${streamerId.twitch_channel_id} is live:`, isLive, '. Was live:', Boolean(streamerId.is_live), '. Needs update:', needsUpdate);

			if (needsUpdate) {
				// Update the database
				console.log(`Updating ${streamerId.twitch_channel_id} to be ${isLive ? "live" : "offline"}`);
				await twitchUpdateIsLive(streamerId.twitch_channel_id, isLive);
				
				if (isLive) {
					// Get the streamer's name
					const streamerName = await getStreamerName(streamerId.twitch_channel_id);
					
					// Get all guilds that are tracking this streamer
					const guildsTrackingStreamer = await twitchGetGuildsTrackingChannel(streamerId.twitch_channel_id)
					for (const guild of guildsTrackingStreamer) {
						// Send a message to the channel
						const channel = await client.channels.fetch(guild.guild_channel_id);
						await (channel as TextChannel).send(
							`${guild.guild_ping_role ? `<@&${guild.guild_ping_role}>` : null} ${streamerName} is now live!`
						);
					}
				} else {
					console.log(`[Twitch] ${streamerId.twitch_channel_id} is offline!`);
				}
			}
		}
	}
}