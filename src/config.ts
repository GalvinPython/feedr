// FILL IN THIS INFORMATION IN .ENV
export const runningInDevMode: boolean = process.argv.includes("--dev");
export interface Config {
    updateIntervalYouTube: number;
    updateIntervalTwitch: number;
}

export const config: Config = {
    updateIntervalYouTube: process.env?.CONFIG_UPDATE_INTERVAL_YOUTUBE
        ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL_YOUTUBE) * 1000
        : 60_000,
    updateIntervalTwitch: process.env?.CONFIG_UPDATE_INTERVAL_TWITCH
        ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL_TWITCH) * 1000
        : 60_000,
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

interface DatabaseConfig {
    host: string | undefined;
    port: string | undefined;
    user: string | undefined;
    password: string | undefined;
    database: string | undefined;
}

export const dbCredentials: DatabaseConfig = {
    host: runningInDevMode
        ? process.env?.POSTGRES_DEV_HOST
        : process.env?.POSTGRES_HOST,
    port: runningInDevMode
        ? process.env?.POSTGRES_DEV_PORT
        : process.env?.POSTGRES_PORT,
    user: runningInDevMode
        ? process.env?.POSTGRES_DEV_USER
        : process.env?.POSTGRES_USER,
    password: runningInDevMode
        ? process.env?.POSTGRES_DEV_PASSWORD
        : process.env?.POSTGRES_PASSWORD,
    database: runningInDevMode
        ? process.env?.POSTGRES_DEV_DB
        : process.env?.POSTGRES_DB,
};
