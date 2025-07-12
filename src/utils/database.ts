import type { dbDiscordTable } from "../types/database";

import { Pool } from "pg";

import { dbCredentials } from "../config";

// import path from "path";
// import { Database } from "bun:sqlite";
// const db = new Database(path.resolve(process.cwd(), "db.sqlite3"));

if (
    !dbCredentials.host ||
    !dbCredentials.port ||
    !dbCredentials.user ||
    !dbCredentials.password ||
    !dbCredentials.database
) {
    throw new Error("Database credentials are not set");
}

export const pool: Pool = new Pool({
    host: dbCredentials.host,
    port: parseInt(dbCredentials.port),
    user: dbCredentials.user,
    password: dbCredentials.password,
    database: dbCredentials.database,
});

// #region YouTube
/**
 * @deprecated This function is deprecated and being removed
 */
export async function getGuildsTrackingChannel(channelId: string) {
    const query = `SELECT * FROM discord WHERE platform_user_id = ?`;

    try {
        const statement = db.prepare(query);
        const results = statement.all(channelId);

        return results;
    } catch (err) {
        console.error("Error getting guilds tracking channel:", err);
        throw err;
    }
}

/**
 * @deprecated This function is deprecated and being removed
 */
export async function updateVideoId(channelId: string, videoId: string) {
    const query = `UPDATE youtube SET latest_video_id = ? WHERE youtube_channel_id = ?`;

    try {
        const statement = db.prepare(query);

        statement.run(videoId, channelId);

        return true;
    } catch (err) {
        console.error("Error updating video ID:", err);

        return false;
    }
}

/**
 * @deprecated This function is deprecated and being removed
 */
export async function stopGuildTrackingChannel(
    guild_id: string,
    channelId: string,
) {
    const query = `DELETE FROM discord WHERE guild_id = ? AND platform_user_id = ?`;

    try {
        const statement = db.prepare(query);

        statement.run(guild_id, channelId);

        return true;
    } catch (err) {
        console.error("Error stopping guild tracking channel:", err);

        return false;
    }
}

// #endregion
// #region Twitch
/**
 * @deprecated This function is deprecated and being removed
 */
export async function twitchGetAllChannelsToTrack() {
    const query = `SELECT * FROM twitch`;

    try {
        const statement = db.prepare(query);
        const results = statement.all();

        return results;
    } catch (err) {
        console.error("Error getting all Twitch channels to track:", err);
        throw err;
    }
}

/**
 * @deprecated This function is deprecated and being removed
 */
export async function twitchGetGuildsTrackingChannel(channelId: string) {
    const query = `SELECT * FROM discord WHERE platform_user_id = ?`;

    try {
        const statement = db.prepare(query);
        const results = statement.all(channelId);

        return results;
    } catch (err) {
        console.error("Error getting guilds tracking Twitch channel:", err);
        throw err;
    }
}

/**
 * @deprecated This function is deprecated and being removed
 */
export async function twitchUpdateIsLive(channelId: string, isLive: boolean) {
    const query = `UPDATE twitch SET is_live = ? WHERE twitch_channel_id = ?`;

    try {
        const statement = db.prepare(query);

        statement.run(isLive, channelId);

        return true;
    } catch (err) {
        console.error("Error updating is live:", err);

        return false;
    }
}

/**
 * @deprecated This function is deprecated and being removed
 */
export async function twitchStopGuildTrackingChannel(
    guild_id: string,
    channelId: string,
) {
    const query = `DELETE FROM discord WHERE guild_id = ? AND platform_user_id = ?`;

    try {
        const statement = db.prepare(query);

        statement.run(guild_id, channelId);

        return true;
    } catch (err) {
        console.error("Error stopping guild tracking Twitch channel:", err);

        return false;
    }
}
// #endregion

// #region i have no idea what im doing here
/**
 * @deprecated This function is deprecated and being removed
 */
export async function getAllTrackedInGuild(
    guild_id: string,
): Promise<dbDiscordTable[]> {
    const query = `SELECT * FROM discord WHERE guild_id = ?`;

    try {
        const statement = db.prepare(query);
        const results = statement.all(guild_id);

        return results as dbDiscordTable[];
    } catch (err) {
        console.error("Error getting all tracked in guild:", err);
        throw err;
    }
}
// #endregion
