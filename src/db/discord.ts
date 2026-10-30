import { eq, and, count, getTableColumns } from "drizzle-orm";

import { Platform } from "../types/types.d";
import { MAX_SUBSCRIPTIONS_PER_PLATFORM } from "../config";

import { db } from "./db";
import {
    deleteQueuedNotificationsForGuild,
    deleteQueuedNotificationsForSubscription,
} from "./messageQueue";
import { dbAuditLogCreate } from "./audit";
import {
    syncTwitchChannelActiveState,
    syncYouTubeChannelActiveState,
} from "./channelActiveState";
import {
    dbGuildYouTubeSubscriptionsTable,
    dbGuildTwitchSubscriptionsTable,
    dbDiscordTable,
    dbYouTubeTable,
    dbTwitchTable,
} from "./schema";

// Check if the guild is tracking the user already
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

export async function getGuildSubscriptionCount(
    guildId: string,
    platform: Platform,
): Promise<number> {
    const table =
        platform === Platform.YouTube
            ? dbGuildYouTubeSubscriptionsTable
            : dbGuildTwitchSubscriptionsTable;
    const [result] = await db
        .select({ count: count() })
        .from(table)
        .where(eq(table.guildId, guildId));

    return result.count;
}

class SubscriptionLimitError extends Error {}

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
): Promise<{ success: boolean; data: []; reason?: "limit_reached" }> {
    console.log(
        `Adding guild ${guildId} tracking for user ${platformUserId} on platform ${platform}`,
    );

    try {
        await db.transaction(async (tx) => {
            const [guild] = await tx
                .select()
                .from(dbDiscordTable)
                .where(eq(dbDiscordTable.guildId, guildId))
                .for("update");

            if (!guild) throw new Error("Guild does not exist.");
            const table =
                platform === Platform.YouTube
                    ? dbGuildYouTubeSubscriptionsTable
                    : dbGuildTwitchSubscriptionsTable;
            const [current] = await tx
                .select({ count: count() })
                .from(table)
                .where(eq(table.guildId, guildId));

            if (current.count >= MAX_SUBSCRIPTIONS_PER_PLATFORM)
                throw new SubscriptionLimitError();
            if (platform === Platform.YouTube) {
                if (
                    youtubeTrackVideos == null ||
                    youtubeTrackShorts == null ||
                    youtubeTrackLive == null
                ) {
                    throw new Error(
                        "YouTube tracking options must be provided for YouTube subscriptions.",
                    );
                }

                await tx
                    .select()
                    .from(dbYouTubeTable)
                    .where(eq(dbYouTubeTable.youtubeChannelId, platformUserId))
                    .for("update");
                await tx.insert(dbGuildYouTubeSubscriptionsTable).values({
                    youtubeChannelId: platformUserId,
                    guildId,
                    notificationChannelId: guildChannelId,
                    notificationRoleId: roleId,
                    isDm,
                    trackVideos: youtubeTrackVideos,
                    trackShorts: youtubeTrackShorts,
                    trackStreams: youtubeTrackLive,
                });
                await syncYouTubeChannelActiveState(platformUserId, tx);
            } else if (platform === Platform.Twitch) {
                await tx
                    .select()
                    .from(dbTwitchTable)
                    .where(eq(dbTwitchTable.twitchChannelId, platformUserId))
                    .for("update");
                await tx.insert(dbGuildTwitchSubscriptionsTable).values({
                    twitchChannelId: platformUserId,
                    guildId,
                    notificationChannelId: guildChannelId,
                    notificationRoleId: roleId,
                    isDm,
                });
                await syncTwitchChannelActiveState(platformUserId, tx);
            } else {
                throw new Error("Invalid platform provided.");
            }
        });

        await dbAuditLogCreate(guildId, "subscription_created", "success", {
            platform,
            platformUserId,
            notificationChannelId: guildChannelId,
            roleId,
            isDm,
        });

        return { success: true, data: [] };
    } catch (error) {
        await dbAuditLogCreate(guildId, "subscription_created", "failure", {
            platform,
            platformUserId,
            notificationChannelId: guildChannelId,
            roleId,
            isDm,
            ...(error instanceof SubscriptionLimitError
                ? { reason: "limit_reached" }
                : { error: String(error) }),
        });
        if (error instanceof SubscriptionLimitError)
            return { success: false, data: [], reason: "limit_reached" };
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
                .select(getTableColumns(dbGuildYouTubeSubscriptionsTable))
                .from(dbGuildYouTubeSubscriptionsTable)
                .innerJoin(
                    dbDiscordTable,
                    eq(
                        dbGuildYouTubeSubscriptionsTable.guildId,
                        dbDiscordTable.guildId,
                    ),
                )
                .where(
                    and(
                        eq(dbDiscordTable.isInServer, true),
                        eq(
                            dbGuildYouTubeSubscriptionsTable.youtubeChannelId,
                            platformUserId,
                        ),
                    ),
                );

            return {
                success: true,
                data: result,
            };
        } else if (platform === Platform.Twitch) {
            const result = await db
                .select(getTableColumns(dbGuildTwitchSubscriptionsTable))
                .from(dbGuildTwitchSubscriptionsTable)
                .innerJoin(
                    dbDiscordTable,
                    eq(
                        dbGuildTwitchSubscriptionsTable.guildId,
                        dbDiscordTable.guildId,
                    ),
                )
                .where(
                    and(
                        eq(dbDiscordTable.isInServer, true),
                        eq(
                            dbGuildTwitchSubscriptionsTable.twitchChannelId,
                            platformUserId,
                        ),
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
              youtubeSubscriptions: {
                  subscription: typeof dbGuildYouTubeSubscriptionsTable.$inferSelect;
                  youtubeChannel: typeof dbYouTubeTable.$inferSelect;
                  discord: typeof dbDiscordTable.$inferSelect;
              }[];
              twitchSubscriptions: {
                  subscription: typeof dbGuildTwitchSubscriptionsTable.$inferSelect;
                  twitchChannel: typeof dbTwitchTable.$inferSelect;
                  discord: typeof dbDiscordTable.$inferSelect;
              }[];
          };
      }
    | { success: false; data: null }
> {
    try {
        const youtubeSubscriptions = await db
            .select({
                subscription: dbGuildYouTubeSubscriptionsTable,
                youtubeChannel: dbYouTubeTable,
                discord: dbDiscordTable,
            })
            .from(dbGuildYouTubeSubscriptionsTable)
            .where(eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId))
            .innerJoin(
                dbYouTubeTable,
                eq(
                    dbGuildYouTubeSubscriptionsTable.youtubeChannelId,
                    dbYouTubeTable.youtubeChannelId,
                ),
            )
            .innerJoin(
                dbDiscordTable,
                eq(
                    dbGuildYouTubeSubscriptionsTable.guildId,
                    dbDiscordTable.guildId,
                ),
            );

        const twitchSubscriptions = await db
            .select({
                subscription: dbGuildTwitchSubscriptionsTable,
                twitchChannel: dbTwitchTable,
                discord: dbDiscordTable,
            })
            .from(dbGuildTwitchSubscriptionsTable)
            .where(eq(dbGuildTwitchSubscriptionsTable.guildId, guildId))
            .innerJoin(
                dbTwitchTable,
                eq(
                    dbGuildTwitchSubscriptionsTable.twitchChannelId,
                    dbTwitchTable.twitchChannelId,
                ),
            )
            .innerJoin(
                dbDiscordTable,
                eq(
                    dbGuildTwitchSubscriptionsTable.guildId,
                    dbDiscordTable.guildId,
                ),
            );

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
    trackingId: string,
    guildId: string,
): Promise<{
    success: boolean;
    data: (
        | typeof dbGuildYouTubeSubscriptionsTable.$inferSelect
        | typeof dbGuildTwitchSubscriptionsTable.$inferSelect
    )[];
}> {
    const parts = trackingId.split(".");

    if (parts.length !== 2) return { success: false, data: [] };
    const [platform, rawId] = parts;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) return { success: false, data: [] };
    try {
        const deleted = await db.transaction(async (tx) => {
            if (platform === Platform.YouTube) {
                const [row] = await tx
                    .select()
                    .from(dbGuildYouTubeSubscriptionsTable)
                    .where(
                        and(
                            eq(dbGuildYouTubeSubscriptionsTable.id, id),
                            eq(
                                dbGuildYouTubeSubscriptionsTable.guildId,
                                guildId,
                            ),
                        ),
                    );

                if (!row) return [];
                await tx
                    .select()
                    .from(dbYouTubeTable)
                    .where(
                        eq(
                            dbYouTubeTable.youtubeChannelId,
                            row.youtubeChannelId,
                        ),
                    )
                    .for("update");
                const result = await tx
                    .delete(dbGuildYouTubeSubscriptionsTable)
                    .where(
                        and(
                            eq(dbGuildYouTubeSubscriptionsTable.id, id),
                            eq(
                                dbGuildYouTubeSubscriptionsTable.guildId,
                                guildId,
                            ),
                        ),
                    )
                    .returning();

                await syncYouTubeChannelActiveState(row.youtubeChannelId, tx);

                return result;
            }
            if (platform === Platform.Twitch) {
                const [row] = await tx
                    .select()
                    .from(dbGuildTwitchSubscriptionsTable)
                    .where(
                        and(
                            eq(dbGuildTwitchSubscriptionsTable.id, id),
                            eq(
                                dbGuildTwitchSubscriptionsTable.guildId,
                                guildId,
                            ),
                        ),
                    );

                if (!row) return [];
                await tx
                    .select()
                    .from(dbTwitchTable)
                    .where(
                        eq(dbTwitchTable.twitchChannelId, row.twitchChannelId),
                    )
                    .for("update");
                const result = await tx
                    .delete(dbGuildTwitchSubscriptionsTable)
                    .where(
                        and(
                            eq(dbGuildTwitchSubscriptionsTable.id, id),
                            eq(
                                dbGuildTwitchSubscriptionsTable.guildId,
                                guildId,
                            ),
                        ),
                    )
                    .returning();

                await syncTwitchChannelActiveState(row.twitchChannelId, tx);

                return result;
            }

            return [];
        });

        for (const row of deleted)
            if ("youtubeChannelId" in row)
                deleteQueuedNotificationsForSubscription(
                    guildId,
                    row.youtubeChannelId,
                    row.notificationChannelId,
                );

        return { success: deleted.length > 0, data: deleted };
    } catch (error) {
        console.error("Error removing guild tracking channel:", error);

        return { success: false, data: [] };
    }
}

// Add a new guild to track
export async function discordAddNewGuild(
    guildId: string,
    isDm?: boolean,
    memberCount = 0,
): Promise<{ success: boolean; data: []; changed?: boolean }> {
    console.log(`Adding new guild to track: ${guildId}`);

    try {
        const changed = await db.transaction(async (tx) => {
            const inserted = await tx
                .insert(dbDiscordTable)
                .values({
                    guildId,
                    allowedPublicSharing: false,
                    isInServer: true,
                    memberCount,
                    isDm: isDm ?? false,
                    feedrUpdatesChannelId: isDm ? guildId : null,
                })
                .onConflictDoNothing()
                .returning();

            if (inserted.length) return true;
            const reactivated = await tx
                .update(dbDiscordTable)
                .set(
                    isDm
                        ? { isInServer: true }
                        : { isInServer: true, memberCount },
                )
                .where(
                    and(
                        eq(dbDiscordTable.guildId, guildId),
                        eq(dbDiscordTable.isInServer, false),
                    ),
                )
                .returning();

            if (reactivated.length) {
                const youtube = await tx
                    .select()
                    .from(dbGuildYouTubeSubscriptionsTable)
                    .where(
                        eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId),
                    );
                const twitch = await tx
                    .select()
                    .from(dbGuildTwitchSubscriptionsTable)
                    .where(
                        eq(dbGuildTwitchSubscriptionsTable.guildId, guildId),
                    );

                for (const channelId of [
                    ...new Set(youtube.map((row) => row.youtubeChannelId)),
                ].sort())
                    await syncYouTubeChannelActiveState(channelId, tx);
                for (const channelId of [
                    ...new Set(twitch.map((row) => row.twitchChannelId)),
                ].sort())
                    await syncTwitchChannelActiveState(channelId, tx);
            }

            if (!isDm && !reactivated.length)
                await tx
                    .update(dbDiscordTable)
                    .set({ memberCount })
                    .where(eq(dbDiscordTable.guildId, guildId));

            return reactivated.length > 0;
        });

        return { success: true, data: [], changed };
    } catch (error) {
        console.error("Error adding new guild to track:", error);

        return { success: false, data: [] };
    }
}

// Remove a departed guild and its dependent records.
export async function discordRemoveGuildFromTracking(
    guildId: string,
): Promise<{ success: boolean; data: []; changed?: boolean }> {
    console.log(`Removing guild from tracking: ${guildId}`);

    try {
        let removed = false;

        await db.transaction(async (tx) => {
            const guild = await tx
                .select()
                .from(dbDiscordTable)
                .where(
                    and(
                        eq(dbDiscordTable.guildId, guildId),
                        eq(dbDiscordTable.isDm, false),
                    ),
                )
                .for("update");

            if (guild.length === 0) return;
            removed = true;
            const youtubeRows = await tx
                .select()
                .from(dbGuildYouTubeSubscriptionsTable)
                .where(eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId));
            const twitchRows = await tx
                .select()
                .from(dbGuildTwitchSubscriptionsTable)
                .where(eq(dbGuildTwitchSubscriptionsTable.guildId, guildId));

            for (const channelId of [
                ...new Set(youtubeRows.map((row) => row.youtubeChannelId)),
            ].sort()) {
                await tx
                    .select()
                    .from(dbYouTubeTable)
                    .where(eq(dbYouTubeTable.youtubeChannelId, channelId))
                    .for("update");
            }
            for (const channelId of [
                ...new Set(twitchRows.map((row) => row.twitchChannelId)),
            ].sort()) {
                await tx
                    .select()
                    .from(dbTwitchTable)
                    .where(eq(dbTwitchTable.twitchChannelId, channelId))
                    .for("update");
            }
            const youtube = await tx
                .delete(dbGuildYouTubeSubscriptionsTable)
                .where(eq(dbGuildYouTubeSubscriptionsTable.guildId, guildId))
                .returning();
            const twitch = await tx
                .delete(dbGuildTwitchSubscriptionsTable)
                .where(eq(dbGuildTwitchSubscriptionsTable.guildId, guildId))
                .returning();

            await tx
                .delete(dbDiscordTable)
                .where(eq(dbDiscordTable.guildId, guildId));
            for (const row of youtube)
                await syncYouTubeChannelActiveState(row.youtubeChannelId, tx);
            for (const row of twitch)
                await syncTwitchChannelActiveState(row.twitchChannelId, tx);
        });

        if (removed) deleteQueuedNotificationsForGuild(guildId);

        return { success: true, data: [], changed: removed };
    } catch (error) {
        console.error("Error removing guild from tracking:", error);

        return { success: false, data: [] };
    }
}

// Check if the DM channel is already in the "guilds" table
export async function discordCheckIfDmChannelExists(
    channelId: string,
): Promise<{ success: boolean; data: (typeof dbDiscordTable.$inferSelect)[] }> {
    console.log(`Checking if DM channel exists: ${channelId}`);

    try {
        const result = await db
            .select()
            .from(dbDiscordTable)
            .where(
                and(
                    eq(dbDiscordTable.guildId, channelId),
                    eq(dbDiscordTable.isDm, true),
                ),
            );

        return { success: true, data: result };
    } catch (error) {
        console.error("Error checking if DM channel exists:", error);

        return { success: false, data: [] };
    }
}

// Bot updates
export async function discordUpdateSubscriptionAddChannel(
    guildId: string,
    channelId: string,
): Promise<{ success: boolean; data: [] }> {
    console.log(
        `Updating guild ${guildId} to set subscription channel to ${channelId}`,
    );

    try {
        await db
            .update(dbDiscordTable)
            .set({ feedrUpdatesChannelId: channelId })
            .where(eq(dbDiscordTable.guildId, guildId));

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error updating subscription channel:", error);

        return { success: false, data: [] };
    }
}

export async function discordUpdateSubscriptionRemoveChannel(
    guildId: string,
): Promise<{ success: boolean; data: [] }> {
    console.log(`Removing subscription channel for guild ${guildId}`);

    try {
        await db
            .update(dbDiscordTable)
            .set({ feedrUpdatesChannelId: null })
            .where(eq(dbDiscordTable.guildId, guildId));

        return { success: true, data: [] };
    } catch (error) {
        console.error("Error removing subscription channel:", error);

        return { success: false, data: [] };
    }
}

export async function discordUpdateSubscriptionCheckGuild(
    guildId: string,
): Promise<{ success: boolean; data: (typeof dbDiscordTable.$inferSelect)[] }> {
    console.log(`Checking subscription settings for guild ${guildId}`);

    try {
        const result = await db
            .select()
            .from(dbDiscordTable)
            .where(eq(dbDiscordTable.guildId, guildId));

        return { success: true, data: result };
    } catch (error) {
        console.error("Error checking subscription settings for guild:", error);

        return { success: false, data: [] };
    }
}
