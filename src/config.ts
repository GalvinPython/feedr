// FILL IN THIS INFORMATION IN .ENV
export const config: { [key: string]: string | number } = {
    updateIntervalYouTube: process.env?.CONFIG_UPDATE_INTERVAL_YOUTUBE
        ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL_YOUTUBE) * 1000
        : 60_000,
    updateIntervalTwitch: process.env?.CONFIG_UPDATE_INTERVAL_TWITCH
        ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL_TWITCH) * 1000
        : 60_000,
};

export const env: { [key: string]: string | undefined } = {
    discordToken: process.argv.includes("--dev")
        ? process.env?.DISCORD_DEV_TOKEN
        : process.env?.DISCORD_TOKEN,
    youtubeApiKey: process.env?.YOUTUBE_API_KEY,
    twitchClientId: process.env?.TWITCH_CLIENT_ID,
    twitchClientSecret: process.env?.TWITCH_CLIENT_SECRET,
};
