import { eq, sql } from "drizzle-orm";

import { db } from "./db";
import {
    dbDiscordTable,
    dbGuildTwitchSubscriptionsTable,
    dbGuildYouTubeSubscriptionsTable,
    dbTwitchTable,
    dbYouTubeTable,
} from "./schema";

type Database = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function syncYouTubeChannelActiveState(
    channelId?: string,
    database: Database = db,
) {
    await database
        .update(dbYouTubeTable)
        .set({
            isActive: sql`exists (select 1 from ${dbGuildYouTubeSubscriptionsTable}
            inner join ${dbDiscordTable} on ${dbDiscordTable.guildId} = ${dbGuildYouTubeSubscriptionsTable.guildId}
            where ${dbGuildYouTubeSubscriptionsTable.youtubeChannelId} = ${dbYouTubeTable.youtubeChannelId}
            and ${dbDiscordTable.isInServer} = true)`,
        })
        .where(
            channelId
                ? eq(dbYouTubeTable.youtubeChannelId, channelId)
                : undefined,
        );
}

export async function syncTwitchChannelActiveState(
    channelId?: string,
    database: Database = db,
) {
    await database
        .update(dbTwitchTable)
        .set({
            isActive: sql`exists (select 1 from ${dbGuildTwitchSubscriptionsTable}
            inner join ${dbDiscordTable} on ${dbDiscordTable.guildId} = ${dbGuildTwitchSubscriptionsTable.guildId}
            where ${dbGuildTwitchSubscriptionsTable.twitchChannelId} = ${dbTwitchTable.twitchChannelId}
            and ${dbDiscordTable.isInServer} = true)`,
        })
        .where(
            channelId
                ? eq(dbTwitchTable.twitchChannelId, channelId)
                : undefined,
        );
}
