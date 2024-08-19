import { env } from "../../config";

export let twitchToken: string | undefined;

export async function getTwitchToken(): Promise<boolean> {
	const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${env.twitchClientId}&client_secret=${env.twitchClientSecret}&grant_type=client_credentials`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!res.ok) {
		console.error("Error fetching Twitch token:", res.statusText);
		return false;
	}

	const data = await res.json();
	twitchToken = data.access_token;
	return true;
}