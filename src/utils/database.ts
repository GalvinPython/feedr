import type { dbYouTube } from "../types/database";

import path from "path";

import { Database } from "bun:sqlite";

const db = new Database(path.resolve(process.cwd(), "db.sqlite3"));

// #region Init Tables
export async function initTables(): Promise<boolean> {
    const createYouTubeTable = `
        CREATE TABLE IF NOT EXISTS youtube (
            youtube_channel_id TEXT PRIMARY KEY,
            latest_video_id TEXT UNIQUE
        );
    `;

    const createDiscordTable = `
        CREATE TABLE IF NOT EXISTS discord (
            guild_id TEXT,
            guild_channel_id TEXT NOT NULL,
            guild_platform TEXT NOT NULL,
            platform_user_id TEXT NOT NULL,
            guild_ping_role TEXT
        );
    `;

    const createTwitchTable = `
        CREATE TABLE IF NOT EXISTS twitch (
            twitch_channel_id TEXT PRIMARY KEY,
            is_live BOOLEAN
        );
    `;

    const createBotInfoTable = `
        CREATE TABLE IF NOT EXISTS bot_info (
            total_servers INTEGER NOT NULL DEFAULT 1,
            total_members INTEGER NOT NULL DEFAULT 1
        );
    `;

    try {
        db.run(createYouTubeTable);
        console.log("YouTube table created");

        db.run(createDiscordTable);
        console.log("Discord table created");

        db.run(createTwitchTable);
        console.log("Twitch table created");

        db.run(createBotInfoTable);
        console.log("Bot Info table created");

        return true;
    } catch (err) {
        console.error("Error creating tables:", err);

        return false;
    }
}
// #endregion

// #region YouTube
// These two functions are for checking/adding a new channel to the youtube table
export async function checkIfChannelIsAlreadyTracked(channelId: string) {
    const query = `SELECT * FROM youtube WHERE youtube_channel_id = ?`;

    try {
        const statement = db.prepare(query);
        const result = statement.all(channelId);

        return result.length > 0;
    } catch (err) {
        console.error("Error checking if channel is already tracked:", err);
        throw err;
    }
}

export async function addNewChannelToTrack(channelId: string) {
    console.log("Adding channel to track:", channelId);
    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${channelId.replace("UC", "UU")}&key=${process.env.YOUTUBE_API_KEY}`,
    );

    if (!res.ok) {
        return false;
    }

    const data = await res.json();
    const videoId =
        data.items?.[0]?.snippet?.thumbnails?.default?.url?.split("/")[4] ||
        null;

    const query = `INSERT INTO youtube (youtube_channel_id, latest_video_id) VALUES (?, ?)`;

    try {
        const statement = db.prepare(query);

        statement.run(channelId, videoId);

        return true;
    } catch (err) {
        console.error("Error adding channel to track:", err);

        return false;
    }
}

export async function checkIfGuildIsTrackingChannelAlready(
    channelId: string,
    guild_id: string,
) {
    const query = `SELECT * FROM discord WHERE platform_user_id = ? AND guild_id = ?`;

    try {
        const statement = db.prepare(query);
        const result = statement.all(channelId, guild_id);

        return result.length > 0;
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

export async function getAllChannelsToTrack() {
    const query = `SELECT * FROM youtube`;

    try {
        const statement = db.prepare(query);
        const results = statement.all() as dbYouTube[];

        return results;
    } catch (err) {
        console.error("Error getting all channels to track:", err);
        throw err;
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

export async function twitchCheckIfGuildIsTrackingChannelAlready(
    channelId: string,
    guild_id: string,
) {
    const query = `SELECT * FROM discord WHERE platform_user_id = ? AND guild_id = ?`;

    try {
        const statement = db.prepare(query);
        const result = statement.all(channelId, guild_id);

        return result.length > 0;
    } catch (err) {
        console.error(
            "Error checking if guild is tracking Twitch channel already:",
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

// #region Bot Info
export async function getBotInfo() {
    const query = `SELECT * FROM bot_info`;

    try {
        const statement = db.prepare(query);
        const result = statement.get();

        return result;
    } catch (err) {
        console.error("Error getting bot info:", err);
        throw err;
    }
}

export async function updateBotInfo(
    total_servers: number,
    total_members: number,
) {
    console.log("Updating bot info:", total_servers, total_members);
    const query = `UPDATE bot_info SET total_servers = ?, total_members = ?`;

    try {
        const statement = db.prepare(query);

        statement.run(total_servers, total_members);

        return true;
    } catch (err) {
        console.error("Error updating bot info:", err);

        return false;
    }
}
// #endregion
