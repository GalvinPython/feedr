import { twitchToken } from "./auth";
import { env } from "../../config";

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

export async function checkIfStreamersAreLive(streamerIds: string[]): Promise<string[]> {
	const streamers = await Promise.all(streamerIds.map(async (streamerId) => {
		const isLive = await checkIfStreamerIsLive(streamerId);
		return isLive ? streamerId : null;
	}));

	return streamers.filter((streamer) => streamer !== null) as string[];
}