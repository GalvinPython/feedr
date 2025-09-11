import { eq } from "drizzle-orm";

import { db } from "./db";
import { dbTwitchTable } from "./schema";

export async function dbTwitchGetAllChannelsToTrack(): Promise<{
    success: boolean;
    data: (typeof dbTwitchTable.$inferSelect)[];
}> {
    try {
        const result = await db.select().from(dbTwitchTable);

        return {
            success: true,
            data: result,
        };
    } catch (err) {
        console.error("Error getting all channels to track:", err);

        return {
            success: false,
            data: [],
        };
    }
}

export async function checkIfStreamerIsAlreadyTracked(
    streamerId: string,
): Promise<{ success: boolean; data: (typeof dbTwitchTable.$inferSelect)[] }> {
    try {
        const result = await db
            .select()
            .from(dbTwitchTable)
            .where(eq(dbTwitchTable.twitchChannelId, streamerId));

        return { success: true, data: result };
    } catch (error) {
        console.error("Error checking if streamer is already tracked:", error);

        return { success: false, data: [] };
    }
}

export async function addNewStreamerToTrack(
    streamerId: string,
    isLive: boolean,
    twitchChannelName: string,
): Promise<{ success: boolean; data?: typeof dbTwitchTable.$inferSelect }> {
    try {
        const [inserted] = await db
            .insert(dbTwitchTable)
            .values({
                twitchChannelId: streamerId,
                twitchChannelIsLive: isLive,
                twitchChannelName: twitchChannelName || "",
            })
            .returning();

        return {
            success: true,
            data: inserted,
        };
    } catch (error) {
        console.error("Error adding new streamer to track:", error);

        return { success: false };
    }
}

// Update a channel to be live or not
export async function twitchUpdateIsLive(
    channelId: string,
    isLive: boolean,
): Promise<{ success: boolean; data?: typeof dbTwitchTable.$inferSelect }> {
    try {
        const [updated] = await db
            .update(dbTwitchTable)
            .set({ twitchChannelIsLive: isLive })
            .where(eq(dbTwitchTable.twitchChannelId, channelId))
            .returning();

        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating channel live status:", error);

        return { success: false };
    }
}
