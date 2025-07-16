import { eq, and } from "drizzle-orm";

import { Platform } from "../types/types";

import { db } from "./db";
import {
    dbGuildYouTubeSubscriptionsTable,
    dbGuildTwitchSubscriptionsTable,
} from "./schema";

export async function checkIfGuildIsTrackingUserAlready(
    platform: Platform,
    userId: string,
    guildId: string,
): Promise<
    | {
          success: true;
          data:
              | (typeof dbGuildYouTubeSubscriptionsTable.$inferSelect)[]
              | (typeof dbGuildTwitchSubscriptionsTable.$inferSelect)[]
              | null;
      }
    | { success: false; data: null }
> {
    console.log(
        `Checking if guild ${guildId} is tracking user ${userId} on platform ${platform}`,
    );

    try {
        let result: any[] = [];

        if (platform === Platform.YouTube) {
            result = await db
                .select()
                .from(dbGuildYouTubeSubscriptionsTable)
                .where(
                    and(
                        eq(
                            dbGuildYouTubeSubscriptionsTable.youtubeChannelId,
                            userId,
                        ),
                        eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId),
                    ),
                );
        } else if (platform === Platform.Twitch) {
            result = await db
                .select()
                .from(dbGuildTwitchSubscriptionsTable)
                .where(
                    and(
                        eq(
                            dbGuildTwitchSubscriptionsTable.twitchChannelId,
                            userId,
                        ),
                        eq(dbGuildTwitchSubscriptionsTable.guildId, guildId),
                    ),
                );
        } else {
            console.error("Invalid platform provided for tracking check.");

            return { success: false, data: null };
        }

        return {
            success: true,
            data: result.length > 0 ? result : null,
        };
    } catch (error) {
        console.error("Error checking if guild is tracking user:", error);

        return { success: false, data: null };
    }
}

export async function discordAddGuildTrackingUser(
    guildId: string,
    platform: Platform,
    platformUserId: string,
    guildChannelId: string,
    roleId: string | null,
    isDm: boolean,

    // YouTube specific tracking options
    youtubeTrackVideos?: boolean | null,
    youtubeTrackShorts?: boolean | null,
    youtubeTrackLive?: boolean | null,
): Promise<{ success: boolean; data: [] }> {
    console.log(
        `Adding guild ${guildId} tracking for user ${platformUserId} on platform ${platform}`,
    );

    try {
        if (platform === Platform.YouTube) {
            if (
                youtubeTrackVideos == null ||
                youtubeTrackShorts == null ||
                youtubeTrackLive == null
            ) {
                console.error(
                    "YouTube tracking options must be provided for YouTube subscriptions.",
                );

                return { success: false, data: [] };
            }

            await db.insert(dbGuildYouTubeSubscriptionsTable).values({
                youtubeChannelId: platformUserId,
                guildId,
                notificationChannelId: guildChannelId,
                notificationRoleId: roleId,
                isDm,
                trackVideos: youtubeTrackVideos,
                trackShorts: youtubeTrackShorts,
                trackStreams: youtubeTrackLive,
            });
        } else if (platform === Platform.Twitch) {
            await db.insert(dbGuildTwitchSubscriptionsTable).values({
                twitchChannelId: platformUserId,
                guildId,
                notificationChannelId: guildChannelId,
                notificationRoleId: roleId,
                isDm,
            });
        } else {
            console.error("Invalid platform provided.");

            return { success: false, data: [] };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error adding guild tracking user:", error);

        return { success: false, data: [] };
    }
}
