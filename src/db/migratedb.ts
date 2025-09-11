import path from "path";

import { Database } from "bun:sqlite";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { config } from "../config";
import { getStreamerName } from "../utils/twitch/getStreamerName";
import checkIfChannelIdIsValid from "../utils/youtube/checkIfChannelIdIsValid";
import { Platform } from "../types/types.d";
import { getTwitchToken } from "../utils/twitch/auth";

import * as sqliteSchema from "./schemaSqlite";
import * as pgSchema from "./schema";
import { addNewChannelToTrack } from "./youtube";
import { addNewStreamerToTrack } from "./twitch";
import { discordAddGuildTrackingUser } from "./discord";

// Get Twitch token
if (!(await getTwitchToken())) {
    throw new Error("Error getting Twitch token");
}

// SQLite connection
const sqlite = new Database(path.resolve(process.cwd(), "db-prod.sqlite3"));
const sqliteDb = drizzleSqlite(sqlite, { schema: sqliteSchema });

// Postgres connection
const client = new Client({ connectionString: config.databaseUrl });

await client.connect();
const pgDb = drizzlePostgres(client, { schema: pgSchema });

console.log("📋 Starting migration...", config.databaseUrl);

async function migrate() {
    // 1. Bot info
    const botInfo = await sqliteDb.select().from(sqliteSchema.sqliteBotInfo);

    for (const row of botInfo) {
        console.log(
            `📋 Migrating bot info: guildsTotal=${row.totalServers ?? 0}, totalMembers=${row.totalMembers ?? 0}`,
        );
        await pgDb.insert(pgSchema.dbBotInfoTable).values({
            guildsTotal: row.totalServers ?? 0,
            totalMembers: row.totalMembers ?? 0,
        });
    }

    // 2. Discord guilds
    const discordRows = await sqliteDb
        .select()
        .from(sqliteSchema.sqliteDiscord);

    for (const row of discordRows) {
        console.log("📋 Migrating discord guild:", row.guildId);
        await pgDb
            .insert(pgSchema.dbDiscordTable)
            .values({ guildId: row.guildId ?? "" })
            .onConflictDoNothing();
    }

    // 3. Twitch
    const twitchRows = await sqliteDb.select().from(sqliteSchema.sqliteTwitch);

    for (const row of twitchRows) {
        const twitchChannelName = await getStreamerName(row.twitchChannelId);

        if (!twitchChannelName) {
            console.log(
                `⚠️  Skipping Twitch channel ID ${row.twitchChannelId} as it no longer exists.`,
            );
            continue;
        }
        await addNewStreamerToTrack(
            row.twitchChannelId,
            Boolean(row.isLive),
            twitchChannelName,
        );
    }

    // 4. YouTube
    const youtubeRows = await sqliteDb
        .select()
        .from(sqliteSchema.sqliteYouTube);

    for (const row of youtubeRows) {
        if (!checkIfChannelIdIsValid(row.youtubeChannelId)) {
            console.log(
                `⚠️  Skipping YouTube channel ID ${row.youtubeChannelId} as it is not a valid channel ID.`,
            );
            continue;
        }
        await addNewChannelToTrack(row.youtubeChannelId);
    }

    // 5. Guild Subscriptions (after Twitch/YouTube exist!)
    for (const row of discordRows) {
        if (row.guildPlatform === "twitch") {
            await discordAddGuildTrackingUser(
                row.guildId,
                Platform.Twitch,
                row.platformUserId,
                row.guildChannelId,
                row.guildPingRole,
                false,
            );
        } else if (row.guildPlatform === "youtube") {
            await discordAddGuildTrackingUser(
                row.guildId,
                Platform.YouTube,
                row.platformUserId,
                row.guildChannelId,
                row.guildPingRole,
                false,
                true,
                true,
                true,
            );
        }
    }
}

await migrate();

// Sometimes the connection pool doesn't close properly
// so we need to force it to close by... doing this
process.exit(0);
