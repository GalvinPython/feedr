import { DiscordAPIError } from "discord.js";

import { Platform } from "../../types/types.d";
import { discordGetAllGuildsTrackingChannel } from "../../db/discord";
import client from "../../client";
import { dbAuditLogCreate } from "../../db/audit";
import {
    deleteQueuedNotification,
    getQueuedNotifications,
    markNotificationSent,
    retryNotification,
} from "../../db/messageQueue";

let sending = false;

export default async function sendLatestUploads(): Promise<void> {
    if (sending) return;
    sending = true;
    try {
        for (const notification of getQueuedNotifications()) {
            const auditData = {
                platform: "youtube",
                videoId: notification.video_id,
                youtubeChannelId: notification.youtube_channel_id,
                notificationChannelId: notification.notification_channel_id,
                isDm: Boolean(notification.is_dm),
                contentType: notification.content_type,
            };

            try {
                const subscriptions = await discordGetAllGuildsTrackingChannel(
                    Platform.YouTube,
                    notification.youtube_channel_id,
                );

                if (!subscriptions.success)
                    throw new Error("Could not verify subscription");
                if (
                    !subscriptions.data.some(
                        (row) =>
                            row.guildId === notification.guild_id &&
                            row.notificationChannelId ===
                                notification.notification_channel_id,
                    )
                ) {
                    deleteQueuedNotification(notification.id);
                    continue;
                }
                const channel = await client.channels.fetch(
                    notification.notification_channel_id,
                );

                if (!channel || !channel.isSendable()) {
                    console.error(
                        "Notification channel is invalid or cannot receive messages:",
                        notification.notification_channel_id,
                    );
                    await dbAuditLogCreate(
                        notification.guild_id,
                        "notification_sent",
                        "failure",
                        { ...auditData, error: "Channel is not sendable" },
                    );
                    markNotificationSent(notification.id);
                    continue;
                }

                const mention = notification.notification_role_id
                    ? `<@&${notification.notification_role_id}> `
                    : "";
                const name = notification.channel_name
                    ? ` for ${notification.channel_name}`
                    : "";

                await channel.send({
                    content: `${mention}New video uploaded${name}! https://www.youtube.com/watch?v=${notification.video_id}`,
                    allowedMentions: {
                        parse: [],
                        roles: notification.notification_role_id
                            ? [notification.notification_role_id]
                            : [],
                    },
                });
                markNotificationSent(notification.id);
                await dbAuditLogCreate(
                    notification.guild_id,
                    "notification_sent",
                    "success",
                    auditData,
                );
            } catch (error) {
                const permanent =
                    error instanceof DiscordAPIError &&
                    ([400, 401, 403, 404].includes(error.status) ||
                        [10003, 50001, 50013, 50007].includes(
                            Number(error.code),
                        ));
                const attempts = notification.attempts + 1;

                if (permanent || attempts >= 5) {
                    markNotificationSent(notification.id);
                    await dbAuditLogCreate(
                        notification.guild_id,
                        "notification_sent",
                        "failure",
                        { ...auditData, error: String(error), attempts },
                    );
                } else {
                    retryNotification(notification.id, attempts);
                }
                console.error("Error fetching or sending notification:", error);
            }
        }
    } catch (error) {
        console.error("Error processing notification queue:", error);
    } finally {
        sending = false;
    }
}
