// FILL IN THIS INFORMATION IN .ENV
export const runningInDevMode: boolean = process.argv.includes("--dev");
export interface Config {
    updateIntervalYouTube: number;
    updateIntervalTwitch: number;
    databaseUrl: string | undefined;
    discordWaitForGuildCacheTime: number;
    discordCollectorTimeout: number;
    discordComponentsPageSize: number;
}

export const config: Config = {
    updateIntervalYouTube: process.env?.CONFIG_UPDATE_INTERVAL_YOUTUBE
        ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL_YOUTUBE) * 1000
        : 60_000,
    updateIntervalTwitch: process.env?.CONFIG_UPDATE_INTERVAL_TWITCH
        ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL_TWITCH) * 1000
        : 60_000,
    databaseUrl: runningInDevMode
        ? process.env?.POSTGRES_DEV_URL
        : process.env?.POSTGRES_URL,
    discordWaitForGuildCacheTime: process.env
        ?.CONFIG_DISCORD_WAIT_FOR_GUILD_CACHE_TIME
        ? parseInt(process.env?.CONFIG_DISCORD_WAIT_FOR_GUILD_CACHE_TIME) * 1000
        : 10_000,
    discordCollectorTimeout: process.env?.CONFIG_DISCORD_COLLECTOR_TIMEOUT
        ? parseInt(process.env?.CONFIG_DISCORD_COLLECTOR_TIMEOUT) * 1000
        : 60_000,
    discordComponentsPageSize: process.env?.CONFIG_DISCORD_COMPONENTS_PAGE_SIZE
        ? parseInt(process.env?.CONFIG_DISCORD_COMPONENTS_PAGE_SIZE)
        : 10,
};

interface Env {
    discordToken: string | undefined;
    youtubeApiKey: string | undefined;
    twitchClientId: string | undefined;
    twitchClientSecret: string | undefined;
}

export const env: Env = {
    discordToken: runningInDevMode
        ? process.env?.DISCORD_DEV_TOKEN
        : process.env?.DISCORD_TOKEN,
    youtubeApiKey: process.env?.YOUTUBE_API_KEY,
    twitchClientId: process.env?.TWITCH_CLIENT_ID,
    twitchClientSecret: process.env?.TWITCH_CLIENT_SECRET,
};
