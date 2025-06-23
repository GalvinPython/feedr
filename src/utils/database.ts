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
export async function checkIfGuildIsTrackingChannelAlready(
    channelId: string,
    guild_id: string,
): Promise<dbDiscordTable[]> {
    const query = `SELECT * FROM discord WHERE platform_user_id = ? AND guild_id = ?`;

    try {
        const statement = db.prepare(query);
        const result = statement.all(channelId, guild_id);

        return result;
    } catch (err) {
        console.error(
            "Error checking if guild is tracking channel already:",
            err,
        );
        throw err;
    }
}

export async function addNewGuildToTrackChannel(
    guild_id: string,
    channelId: string,
    guild_channel_id: string,
    guild_ping_role: string | null,
) {
    const query = `INSERT INTO discord (guild_id, platform_user_id, guild_channel_id, guild_ping_role, guild_platform) VALUES (?, ?, ?, ?, 'youtube')`;

    try {
        const statement = db.prepare(query);

        statement.run(guild_id, channelId, guild_channel_id, guild_ping_role);

        return true;
    } catch (err) {
        console.error("Error adding guild to track channel:", err);

        return false;
    }
}

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

export async function twitchCheckIfChannelIsAlreadyTracked(channelId: string) {
    const query = `SELECT * FROM twitch WHERE twitch_channel_id = ?`;

    try {
        const statement = db.prepare(query);
        const result = statement.all(channelId);

        return result.length > 0;
    } catch (err) {
        console.error(
            "Error checking if Twitch channel is already tracked:",
            err,
        );
        throw err;
    }
}

export async function twitchAddNewChannelToTrack(
    channelId: string,
    isLive: boolean,
) {
    const query = `INSERT INTO twitch (twitch_channel_id, is_live) VALUES (?, ?)`;

    try {
        const statement = db.prepare(query);

        statement.run(channelId, isLive);

        return true;
    } catch (err) {
        console.error("Error adding Twitch channel to track:", err);

        return false;
    }
}

export async function twitchAddNewGuildToTrackChannel(
    guild_id: string,
    channelId: string,
    guild_channel_id: string,
    guild_ping_role: string | null,
) {
    const query = `INSERT INTO discord (guild_id, platform_user_id, guild_channel_id, guild_ping_role, guild_platform) VALUES (?, ?, ?, ?, 'twitch')`;

    try {
        const statement = db.prepare(query);

        statement.run(guild_id, channelId, guild_channel_id, guild_ping_role);

        return true;
    } catch (err) {
        console.error("Error adding guild to track Twitch channel:", err);

        return false;
    }
}

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
