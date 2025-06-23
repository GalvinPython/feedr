import path from "path";

import { Database } from "bun:sqlite";

import { pool } from "./database";

const sqliteDb = new Database(path.resolve(process.cwd(), "db.sqlite3"));
// const sqliteDb = new Database(path.resolve(process.cwd(), "db-prod.sqlite3"));

const client = await pool.connect();

console.log("▶️ Starting migration...");

// Load SQLite data
const discordData = sqliteDb.query("SELECT * FROM discord").all();

console.log(
    `🔃 Loaded ${discordData.length} rows from discord table in SQLite`,
);
const youtubeData = sqliteDb.query("SELECT * FROM youtube").all();

console.log(
    `🔃 Loaded ${youtubeData.length} rows from youtube table in SQLite`,
);
const twitchData = sqliteDb.query("SELECT * FROM twitch").all();

console.log(`🔃 Loaded ${twitchData.length} rows from twitch table in SQLite`);
const botInfoData = sqliteDb.query("SELECT * FROM bot_info").all();

console.log(
    `🔃 Loaded ${botInfoData.length} rows from bot_info table in SQLite`,
);

// Insert into discord table
const uniqueGuilds = new Set(discordData.map((d: any) => d.guild_id));

for (const guild_id of uniqueGuilds) {
    await client.query(
        `
    INSERT INTO discord (guild_id, is_dm, allowed_public_sharing)
    VALUES ($1, false, false)
    ON CONFLICT (guild_id) DO NOTHING
  `,
        [guild_id],
    );
    console.log(`➡️ Inserted guild ${guild_id} into discord table`);
}

// Insert into twitch table
for (const row of twitchData as any) {
    await client.query(
        `
    INSERT INTO twitch (twitch_channel_id, twitch_channel_is_live)
    VALUES ($1, $2)
    ON CONFLICT (twitch_channel_id) DO NOTHING
  `,
        [row.twitch_channel_id, row.is_live === 1],
    );
    console.log(
        `➡️ Inserted twitch channel ${row.twitch_channel_id} into twitch table`,
    );
}

// Insert into youtube table
for (const row of youtubeData as any) {
    await client.query(
        `
    INSERT INTO youtube (youtube_channel_id, latest_video_id)
    VALUES ($1, $2)
    ON CONFLICT (youtube_channel_id) DO UPDATE SET latest_video_id = EXCLUDED.latest_video_id
  `,
        [row.youtube_channel_id, row.latest_video_id],
    );
    console.log(
        `➡️ Inserted youtube channel ${row.youtube_channel_id} into youtube table`,
    );
}

// Insert into guild_twitch_subscriptions and guild_youtube_subscriptions
for (const row of discordData as any) {
    const is_dm = false;

    if (row.guild_platform === "twitch") {
        await client.query(
            `
      INSERT INTO guild_twitch_subscriptions 
      (guild_id, twitch_channel_id, notification_channel_id, notification_role_id, is_dm)
      VALUES ($1, $2, $3, $4, $5)
    `,
            [
                row.guild_id,
                row.platform_user_id,
                row.guild_channel_id,
                row.guild_ping_role,
                is_dm,
            ],
        );
    } else if (row.guild_platform === "youtube") {
        await client.query(
            `
      INSERT INTO guild_youtube_subscriptions 
      (guild_id, youtube_channel_id, notification_channel_id, notification_role_id, is_dm, track_videos, track_shorts, track_streams)
      VALUES ($1, $2, $3, $4, $5, false, false, false)
    `,
            [
                row.guild_id,
                row.platform_user_id,
                row.guild_channel_id,
                row.guild_ping_role,
                is_dm,
            ],
        );
    }
    console.log(
        `➡️ Inserted ${row.guild_platform} subscription for guild ${row.guild_id} into subscriptions table`,
    );
}

// Insert into bot_info
if (botInfoData.length > 0) {
    const row = botInfoData[0] as any;

    await client.query(
        `
    INSERT INTO bot_info (guilds_total, channels_tracked, total_members, time)
    VALUES ($1, 0, $2, now())
  `,
        [row.total_servers, row.total_members],
    );
    console.log(
        `➡️ Inserted bot info with guilds_total: ${row.total_servers} and total_members: ${row.total_members}`,
    );
}

console.log("✅ Migration complete.");

// Sometimes the connection pool doesn't close properly
// so we need to force it to close by... doing this
process.exit(0);
