import { env } from "./config.ts";
import fetchLatestUploads from "./utils/youtube/fetchLatestUploads.ts";

if (!env.youtubeApiKey || env.youtubeApiKey === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("You MUST provide a YouTube API key in .env!");
}

console.log("Starting standalone YouTube database update...");

await fetchLatestUploads();

console.log("YouTube database update complete.");

process.exit(0);
