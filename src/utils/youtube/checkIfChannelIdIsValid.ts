// This function checks if a given YouTube channel ID is valid by making a request to the YouTube Data API.
import { env } from "../../config";

export default async function checkIfChannelIdIsValid(channelId: string) {
    // Invalid channel ID format
    if (!channelId.startsWith("UC")) {
        return false;
    }

    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${env.youtubeApiKey}`,
    );
    const data = await res.json();

    return data.items !== undefined && data.items.length > 0;
}
