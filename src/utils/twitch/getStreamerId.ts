import { twitchToken } from "./auth";
import { env } from "../../config";

export async function getStreamerId(streamerId: string): Promise<string | null> {
	if (!twitchToken || !env.twitchClientId) {
		console.error("Twitch token not found in getStreamerId");
		return null;
	}

	const res = await fetch(`https://api.twitch.tv/helix/users?login=${streamerId.toLowerCase()}`, {
		headers: {
			'Client-ID': env.twitchClientId,
			'Authorization': `Bearer ${twitchToken}`,
		},
	});

	if (!res.ok) {
		console.error("Error fetching stream data in checkIfStreamerIsLive:", res.statusText);
		return null
	}

	const data = await res.json();
	console.log("Streamer data:", data);
	if (data.data && data.data.length > 0) {
		return data.data[0].id;
	} else {
		return null;
	}
}