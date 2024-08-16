import { env } from "../config"

export default async function checkIfChannelIdIsValid(channelId: string) {
	const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${env.youtubeApiKey}`);
	const data = await res.json();
	return data.items !== undefined && data.items.length > 0;
}