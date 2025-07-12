import { pool } from "../database";

export default async function initTables(): Promise<boolean> {
    const createDiscordTable = `
        CREATE TABLE IF NOT EXISTS discord (
            guild_id TEXT PRIMARY KEY,
            is_dm BOOLEAN NOT NULL DEFAULT FALSE,
            allowed_public_sharing BOOLEAN NOT NULL DEFAULT FALSE,
            feedr_updates_channel_id TEXT
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
            time TIMESTAMP NOT NULL DEFAULT now()
        );
    `;

    const createBotInfoNotificationsTable = `
        CREATE TABLE IF NOT EXISTS bot_info_notifications (
            date DATE NOT NULL,
            total_youtube INTEGER NOT NULL DEFAULT 0,
            total_twitch INTEGER NOT NULL DEFAULT 0
        );
    `;

    const createBotInfoNotificationsTimingsTable = `
        CREATE TABLE IF NOT EXISTS bot_info_notifications_timings (
            time TIMESTAMP NOT NULL,
            channel_id TEXT NOT NULL REFERENCES youtube(youtube_channel_id),
            time_ms INTEGER NOT NULL DEFAULT 0
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

    const seedBotInfoTable = `
        INSERT INTO bot_info (time, guilds_total, channels_tracked, total_members) VALUES (now(), 0, 0, 0)
    `;

    // TODO: Fix the guild table
    const tempDropQuery = `
    DO $$
    BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'guild_youtube_subscriptions_guild_id_fkey'
        AND table_name = 'guild_youtube_subscriptions'
    ) THEN
        ALTER TABLE guild_youtube_subscriptions
        DROP CONSTRAINT guild_youtube_subscriptions_guild_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'guild_twitch_subscriptions_guild_id_fkey'
        AND table_name = 'guild_twitch_subscriptions'
    ) THEN
        ALTER TABLE guild_twitch_subscriptions
        DROP CONSTRAINT guild_twitch_subscriptions_guild_id_fkey;
    END IF;
    END$$;
    `;

    try {
        const client = await pool.connect();

        await client.query(createDiscordTable);
        console.log("Discord table created");

        await client.query(createBlueskyTable);
        console.log("Bluesky table created");

        await client.query(createYouTubeTable);
        console.log("YouTube table created");

        await client.query(createTwitchTable);
        console.log("Twitch table created");

        await client.query(createGuildBlueskySubscriptionsTable);
        console.log("Guild Bluesky Subscriptions table created");

        await client.query(createGuildYouTubeSubscriptionsTable);
        console.log("Guild YouTube Subscriptions table created");

        await client.query(createGuildTwitchSubscriptionsTable);
        console.log("Guild Twitch Subscriptions table created");

        await client.query(createBotInfoTable);
        console.log("Bot Info table created");

        await client.query(createBotInfoNotificationsTable);
        console.log("Bot Info Notifications table created");

        await client.query(createBotInfoNotificationsTimingsTable);
        console.log("Bot Info Notifications Timings table created");

        await client.query(createBotInfoTopChannelsTable);
        console.log("Bot Info Top Channels table created");

        await client.query(createBotInfoTopGuildsTable);
        console.log("Bot Info Top Guilds table created");

        await client.query(createAuditLogsTable);
        console.log("Audit Logs table created");

        await client.query(seedBotInfoTable);
        console.log("Bot Info table seeded");

        await client.query(tempDropQuery);
        console.log("Temporary drop query executed");

        client.release();

        return true;
    } catch (err) {
        console.error("Error creating tables:", err);

        return false;
    }
}
