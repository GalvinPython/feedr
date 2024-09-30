import mysql from 'mysql2';
import type { dbYouTube } from '../types/database';

const pool = mysql.createPool({
	host: process.env.MYSQL_ADDRESS as string,
	port: parseInt(process.env.MYSQL_PORT as string),
	user: process.env.MYSQL_USER as string,
	password: process.env.MYSQL_PASSWORD as string,
	database: process.env.MYSQL_DATABASE as string,
});

//#region Init Tables
export async function initTables(): Promise<boolean> {
	const createYouTubeTable = `
		CREATE TABLE IF NOT EXISTS youtube (
			youtube_channel_id VARCHAR(255) NOT NULL PRIMARY KEY,
			latest_video_id VARCHAR(255) UNIQUE
		);
	`;

	const createDiscordTable = `
		CREATE TABLE IF NOT EXISTS discord (
			guild_id VARCHAR(255),
			guild_channel_id VARCHAR(255) NOT NULL,
			guild_platform VARCHAR(255) NOT NULL,
			platform_user_id VARCHAR(255) NOT NULL,
			guild_ping_role VARCHAR(255),
			INDEX (guild_id),
			INDEX (platform_user_id)
		);
	`;

	const createTwitchTable = `
		CREATE TABLE IF NOT EXISTS twitch (
			twitch_channel_id VARCHAR(255) NOT NULL PRIMARY KEY,
			is_live BOOLEAN
		);
	`;

	pool.query(createYouTubeTable, (err) => {
		if (err) {
			console.error("Error creating YouTube table:", err);
			return false
		} else {
			console.log("Guilds YouTube created");
		}
	});
	pool.query(createDiscordTable, (err) => {
		if (err) {
			console.error("Error creating Discord table:", err);
			return false
		} else {
			console.log("Discord table created");
		}
	});
	pool.query(createTwitchTable, (err) => {
		if (err) {
			console.error("Error creating Twitch table:", err);
			return false
		} else {
			console.log("Twitch table created");
		}
	});
	return true;
}
//#endregion


//#region YouTube
// These two functions are for checking/adding a new channel to the youtube table
export async function checkIfChannelIsAlreadyTracked(channelId: string) {
	const query = `SELECT * FROM youtube WHERE youtube_channel_id = ?`;
	return new Promise<boolean>((resolve, reject) => {
		pool.query(query, [channelId], (err, results) => {
			if (err) {
				console.error("Error checking if channel is already tracked:", err);
				reject(err);
			} else {
				resolve(results.length > 0);
			}
		});
	});
}

export async function addNewChannelToTrack(channelId: string) {
	console.log("Adding channel to track:", channelId);
	const res = await fetch(`https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${channelId.replace("UC", "UU")}&key=${process.env.YOUTUBE_API_KEY}`);
	if (!res.ok) {
		return false;
	}

	const data = await res.json();
	const videoId = data.items?.[0]?.snippet?.thumbnails?.default?.url?.split('/')[4] || null;

	const query = `INSERT INTO youtube (youtube_channel_id, latest_video_id) VALUES (?, ?)`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [channelId, videoId], (err) => {
			if (err) {
				console.error("Error adding channel to track:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

export async function checkIfGuildIsTrackingChannelAlready(channelId: string, guild_id: string) {
	const query = `SELECT * FROM discord WHERE platform_user_id = ? AND guild_id = ?`;
	return new Promise<boolean>((resolve, reject) => {
		pool.query(query, [channelId, guild_id], (err, results) => {
			if (err) {
				console.error("Error checking if guild is tracking channel already:", err);
				reject(err);
			} else {
				resolve(results.length > 0);
			}
		});
	});
}


export async function addNewGuildToTrackChannel(guild_id: string, channelId: string, guild_channel_id: string, guild_ping_role: string | null) {
	const query = `INSERT INTO discord (guild_id, platform_user_id, guild_channel_id, guild_ping_role, guild_platform) VALUES (?, ?, ?, ?, 'youtube')`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [guild_id, channelId, guild_channel_id, guild_ping_role], (err) => {
			if (err) {
				console.error("Error adding guild to track channel:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

export async function getAllChannelsToTrack() {
	const query = `SELECT * FROM youtube`;
	return new Promise<dbYouTube[]>((resolve, reject) =>
		pool.query(query, (err, results: dbYouTube[]) => {
			if (err) {
				console.error("Error getting all channels to track:", err);
				reject(err);
			} else {
				resolve(results);
			}
		})
	);
}

export async function getGuildsTrackingChannel(channelId: string) {
	const query = `SELECT * FROM discord WHERE platform_user_id = ?`;
	return new Promise<any>((resolve, reject) =>
		pool.query(query, [channelId], (err, results: any) => {
			if (err) {
				console.error("Error getting guilds tracking channel:", err);
				reject(err);
			} else {
				resolve(results);
			}
		})
	);
}

export async function updateVideoId(channelId: string, videoId: string) {
	const query = `UPDATE youtube SET latest_video_id = ? WHERE youtube_channel_id = ?`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [videoId, channelId], (err) => {
			if (err) {
				console.error("Error updating video ID:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

export async function stopGuildTrackingChannel(guild_id: string, channelId: string) {
	const query = `DELETE FROM discord WHERE guild_id = ? AND platform_user_id = ?`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [guild_id, channelId], (err) => {
			if (err) {
				console.error("Error stopping guild tracking channel:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

//#endregion
//#region Twitch
export async function twitchGetAllChannelsToTrack() {
	const query = `SELECT * FROM twitch`;
	return new Promise<any>((resolve, reject) =>
		pool.query(query, (err, results: any) => {
			if (err) {
				console.error("Error getting all Twitch channels to track:", err);
				reject(err);
			} else {
				resolve(results);
			}
		})
	);
}

export async function twitchCheckIfChannelIsAlreadyTracked(channelId: string) {
	const query = `SELECT * FROM twitch WHERE twitch_channel_id = ?`;
	return new Promise<boolean>((resolve, reject) => {
		pool.query(query, [channelId], (err, results) => {
			if (err) {
				console.error("Error checking if Twitch channel is already tracked:", err);
				reject(err);
			} else {
				resolve(results.length > 0);
			}
		});
	});
}

export async function twitchCheckIfGuildIsTrackingChannelAlready(channelId: string, guild_id: string) {
	const query = `SELECT * FROM discord WHERE platform_user_id = ? AND guild_id = ?`;
	return new Promise<boolean>((resolve, reject) => {
		pool.query(query, [channelId, guild_id], (err, results) => {
			if (err) {
				console.error("Error checking if guild is tracking Twitch channel already:", err);
				reject(err);
			} else {
				resolve(results.length > 0);
			}
		});
	});
}

export async function twitchAddNewChannelToTrack(channelId: string, isLive: boolean) {
	const query = `INSERT INTO twitch (twitch_channel_id, is_live) VALUES (?, ?)`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [channelId, isLive], (err) => {
			if (err) {
				console.error("Error adding Twitch channel to track:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

export async function twitchAddNewGuildToTrackChannel(guild_id: string, channelId: string, guild_channel_id: string, guild_ping_role: string | null) {
	const query = `INSERT INTO discord (guild_id, platform_user_id, guild_channel_id, guild_ping_role, guild_platform) VALUES (?, ?, ?, ?, 'twitch')`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [guild_id, channelId, guild_channel_id, guild_ping_role], (err) => {
			if (err) {
				console.error("Error adding guild to track Twitch channel:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

export async function twitchGetGuildsTrackingChannel(channelId: string) {
	const query = `SELECT * FROM discord WHERE platform_user_id = ?`;
	return new Promise<any>((resolve, reject) =>
		pool.query(query, [channelId], (err, results: any) => {
			if (err) {
				console.error("Error getting guilds tracking Twitch channel:", err);
				reject(err);
			} else {
				resolve(results);
			}
		})
	);
}

export async function twitchUpdateIsLive(channelId: string, isLive: boolean) {
	const query = `UPDATE twitch SET is_live = ? WHERE twitch_channel_id = ?`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [isLive, channelId], (err) => {
			if (err) {
				console.error("Error updating is live:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}

export async function twitchStopGuildTrackingChannel(guild_id: string, channelId: string) {
	const query = `DELETE FROM discord WHERE guild_id = ? AND platform_user_id = ?`;
	return new Promise<boolean>((resolve, reject) =>
		pool.query(query, [guild_id, channelId], (err) => {
			if (err) {
				console.error("Error stopping guild tracking Twitch channel:", err);
				reject(err);
			} else {
				resolve(true);
			}
		})
	);
}
//#endregion