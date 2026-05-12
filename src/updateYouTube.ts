import { env } from "./config.ts";
import fetchLatestUploads from "./utils/youtube/fetchLatestUploads.ts";

if (!env.youtubeApiKey || env.youtubeApiKey === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("You MUST provide a YouTube API key in .env!");
}

console.log("Starting standalone YouTube database update...");

const updateSucceeded = await fetchLatestUploads();

if (updateSucceeded === true) {
    console.log("YouTube database update complete.");
    process.exit(0);
}

console.error("YouTube database update failed.");
process.exit(1);
