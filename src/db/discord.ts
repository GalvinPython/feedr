import { eq, and } from "drizzle-orm";

import { Platform } from "../types/types.d";

import { db } from "./db";
import {
    dbGuildYouTubeSubscriptionsTable,
    dbGuildTwitchSubscriptionsTable,
    dbDiscordTable,
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

// Get all the Discord guilds that are tracking either YouTube or Twitch channels
export async function discordGetAllGuildsTrackingChannel(
    platform: Platform,
    platformUserId: string,
): Promise<
    | {
          success: true;
          data: (typeof dbGuildYouTubeSubscriptionsTable.$inferSelect)[];
      }
    | {
          success: true;
          data: (typeof dbGuildTwitchSubscriptionsTable.$inferSelect)[];
      }
    | { success: false; data: [] }
> {
    try {
        if (platform === Platform.YouTube) {
            const result = await db
                .select()
                .from(dbGuildYouTubeSubscriptionsTable)
                .where(
                    eq(
                        dbGuildYouTubeSubscriptionsTable.youtubeChannelId,
                        platformUserId,
                    ),
                );

            return {
                success: true,
                data: result,
            };
        } else if (platform === Platform.Twitch) {
            const result = await db
                .select()
                .from(dbGuildTwitchSubscriptionsTable)
                .where(
                    eq(
                        dbGuildTwitchSubscriptionsTable.twitchChannelId,
                        platformUserId,
                    ),
                );

            return {
                success: true,
                data: result,
            };
        } else {
            console.error("Invalid platform provided for tracking guilds.");

            return { success: false, data: [] };
        }
    } catch (error) {
        console.error("Error getting all guilds tracking channels:", error);

        return { success: false, data: [] };
    }
}

// Get all tracked in the guild
export async function discordGetAllTrackedInGuild(guildId: string): Promise<
    | {
          success: true;
          data: {
              youtubeSubscriptions: (typeof dbGuildYouTubeSubscriptionsTable.$inferSelect)[];
              twitchSubscriptions: (typeof dbGuildTwitchSubscriptionsTable.$inferSelect)[];
          };
      }
    | { success: false; data: null }
> {
    try {
        const youtubeSubscriptions = await db
            .select()
            .from(dbGuildYouTubeSubscriptionsTable)
            .where(eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId));

        const twitchSubscriptions = await db
            .select()
            .from(dbGuildTwitchSubscriptionsTable)
            .where(eq(dbGuildTwitchSubscriptionsTable.guildId, guildId));

        return {
            success: true,
            data: {
                youtubeSubscriptions,
                twitchSubscriptions,
            },
        };
    } catch (error) {
        console.error(
            "Error getting all tracked subscriptions in guild:",
            error,
        );

        return { success: false, data: null };
    }
}

// Remove tracking for a specific channel in a guild
export async function discordRemoveGuildTrackingChannel(
    guildId: string,
    platform: Platform,
    platformUserId: string,
): Promise<{ success: boolean; data: [] }> {
    console.log(
        `Removing guild ${guildId} tracking for user ${platformUserId} on platform ${platform}`,
    );

    try {
        if (platform === Platform.YouTube) {
            await db
                .delete(dbGuildYouTubeSubscriptionsTable)
                .where(
                    and(
                        eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId),
                        eq(
                            dbGuildYouTubeSubscriptionsTable.youtubeChannelId,
                            platformUserId,
                        ),
                    ),
                );
        } else if (platform === Platform.Twitch) {
            await db
                .delete(dbGuildTwitchSubscriptionsTable)
                .where(
                    and(
                        eq(dbGuildTwitchSubscriptionsTable.guildId, guildId),
                        eq(
                            dbGuildTwitchSubscriptionsTable.twitchChannelId,
                            platformUserId,
                        ),
                    ),
                );
        } else {
            console.error("Invalid platform provided for removal.");

            return { success: false, data: [] };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error removing guild tracking channel:", error);

        return { success: false, data: [] };
    }
}

// Add a new guild to track
export async function discordAddNewGuild(
    guildId: string,
): Promise<{ success: boolean; data: [] }> {
    console.log(`Adding new guild to track: ${guildId}`);

    try {
        await db.insert(dbDiscordTable).values({
            guildId: guildId,
            allowedPublicSharing: false,
            isInServer: true,
            memberCount: 0,
        });

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error adding new guild to track:", error);

        return { success: false, data: [] };
    }
}

// "Remove" a guild from tracking
// Basically just set isInServer to false for archival purposes
export async function discordRemoveGuildFromTracking(
    guildId: string,
): Promise<{ success: boolean; data: [] }> {
    console.log(`Removing guild from tracking: ${guildId}`);

    try {
        await db
            .update(dbDiscordTable)
            .set({ isInServer: false })
            .where(eq(dbDiscordTable.guildId, guildId));

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error removing guild from tracking:", error);

        return { success: false, data: [] };
    }
}
