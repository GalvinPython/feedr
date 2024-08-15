import { env } from "../config";

interface channelDetails {
	channelName: string;
	channelPfp: string;
	channelHandle: string;
}

export default async function (channelId: string): Promise<channelDetails | null> {
	const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${env.youtubeApiKey}`)
	if (!res.ok) {
		return null
	}

	// If channel exists lol
	const data = await res.json()
	return {
		channelName: data.items[0].snippet.title,
		channelPfp: data.items[0].snippet.thumbnails.medium.url,
		channelHandle: data.items[0].snippet.customUrl
	}
}