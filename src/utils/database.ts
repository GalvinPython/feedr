import type { dbDiscordTable, dbYouTube } from "../types/database";

import { Pool } from "pg";

import { dbCredentials, env } from "../config";

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

// #region Init Tables
export async function initTables(): Promise<boolean> {
    const createDiscordTable = `
        CREATE TABLE IF NOT EXISTS discord (
            guild_id TEXT PRIMARY KEY,
            is_dm BOOLEAN NOT NULL DEFAULT FALSE,
            allowed_public_sharing BOOLEAN NOT NULL DEFAULT FALSE
        );
    `;

    const createBlueskyTable = `
        CREATE TABLE IF NOT EXISTS bluesky (
            bluesky_user_id TEXT PRIMARY KEY,
            latest_post_id TEXT,
            latest_reply_id TEXT
        );
    `;

    const createYouTubeTable = `
        CREATE TABLE IF NOT EXISTS youtube (
            youtube_channel_id TEXT PRIMARY KEY,
            latest_video_id TEXT,
            latest_video_id_updated TIMESTAMP,
            latest_short_id TEXT,
            latest_short_id_updated TIMESTAMP,
            latest_stream_id TEXT,
            latest_stream_id_updated TIMESTAMP,
            youtube_channel_is_live BOOLEAN
        );
    `;

    const createTwitchTable = `
        CREATE TABLE IF NOT EXISTS twitch (
            twitch_channel_id TEXT PRIMARY KEY,
            twitch_channel_is_live BOOLEAN NOT NULL
        );
    `;

    const createGuildBlueskySubscriptionsTable = `
        CREATE TABLE IF NOT EXISTS guild_bluesky_subscriptions (
            id SERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES discord(guild_id),
            bluesky_user_id TEXT NOT NULL REFERENCES bluesky(bluesky_user_id),
            notification_channel_id TEXT NOT NULL,
            notification_role_id TEXT,
            is_dm BOOLEAN NOT NULL DEFAULT FALSE,
            check_for_replies BOOLEAN NOT NULL DEFAULT FALSE
        );
    `;

    const createGuildYouTubeSubscriptionsTable = `
        CREATE TABLE IF NOT EXISTS guild_youtube_subscriptions (
            id SERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES discord(guild_id),
            youtube_channel_id TEXT NOT NULL REFERENCES youtube(youtube_channel_id),
            notification_channel_id TEXT NOT NULL,
            notification_role_id TEXT,
            is_dm BOOLEAN NOT NULL DEFAULT FALSE,
            track_videos BOOLEAN NOT NULL DEFAULT FALSE,
            track_shorts BOOLEAN NOT NULL DEFAULT FALSE,
            track_streams BOOLEAN NOT NULL DEFAULT FALSE
        );
    `;

    const createGuildTwitchSubscriptionsTable = `
        CREATE TABLE IF NOT EXISTS guild_twitch_subscriptions (
            id SERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES discord(guild_id),
            twitch_channel_id TEXT NOT NULL REFERENCES twitch(twitch_channel_id),
            notification_channel_id TEXT NOT NULL,
            notification_role_id TEXT,
            is_dm BOOLEAN NOT NULL DEFAULT FALSE
        );
    `;

    const createBotInfoTable = `
        CREATE TABLE IF NOT EXISTS bot_info (
            guilds_total INTEGER NOT NULL DEFAULT 0,
            channels_tracked INTEGER NOT NULL DEFAULT 0,
            total_members INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            extended_info_updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
    `;

    const createBotInfoNotificationsTable = `
        CREATE TABLE IF NOT EXISTS bot_info_notifications (
            date DATE NOT NULL,
            total_youtube INTEGER NOT NULL DEFAULT 0,
            total_twitch INTEGER NOT NULL DEFAULT 0
        );
    `;

    const createBotInfoTopChannelsTable = `
        CREATE TABLE IF NOT EXISTS bot_info_top_channels (
            youtube_channel_id TEXT PRIMARY KEY REFERENCES youtube(youtube_channel_id),
            guilds_tracking INTEGER NOT NULL DEFAULT 0
        );
    `;

    const createBotInfoTopGuildsTable = `
        CREATE TABLE IF NOT EXISTS bot_info_top_guilds (
            guild_id TEXT PRIMARY KEY REFERENCES discord(guild_id),
            members INTEGER NOT NULL DEFAULT 0
        );
    `;

    const createAuditLogsTable = `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            event_type TEXT NOT NULL,
            guild_id TEXT NOT NULL REFERENCES discord(guild_id),
            related_id TEXT NOT NULL,
            note TEXT,
            occurred_at TIMESTAMP DEFAULT now()
        );
    `;

    try {
        await pool.query(createDiscordTable);
        console.log("Discord table created");

        await pool.query(createBlueskyTable);
        console.log("Bluesky table created");

        await pool.query(createYouTubeTable);
        console.log("YouTube table created");

        await pool.query(createTwitchTable);
        console.log("Twitch table created");

        await pool.query(createGuildBlueskySubscriptionsTable);
        console.log("Guild Bluesky Subscriptions table created");

        await pool.query(createGuildYouTubeSubscriptionsTable);
        console.log("Guild YouTube Subscriptions table created");

        await pool.query(createGuildTwitchSubscriptionsTable);
        console.log("Guild Twitch Subscriptions table created");

        await pool.query(createBotInfoTable);
        console.log("Bot Info table created");

        await pool.query(createBotInfoNotificationsTable);
        console.log("Bot Info Notifications table created");

        await pool.query(createBotInfoTopChannelsTable);
        console.log("Bot Info Top Channels table created");

        await pool.query(createBotInfoTopGuildsTable);
        console.log("Bot Info Top Guilds table created");

        await pool.query(createAuditLogsTable);
        console.log("Audit Logs table created");

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
        `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${channelId.replace("UC", "UU")}&key=${env.youtubeApiKey}`,
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
