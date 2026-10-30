import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";

import client from "../../client";
import {
    deleteQueuedNotification,
    getQueuedNotifications,
} from "../../db/messageQueue";

let sending = false;

export default async function sendLatestUploads(): Promise<void> {
    if (sending) return;
    sending = true;
    try {
        for (const notification of getQueuedNotifications()) {
            try {
                const channel = await client.channels.fetch(
                    notification.notification_channel_id,
                );

                if (!channel || !channel.isSendable()) {
                    console.error(
                        "Notification channel is invalid or cannot receive messages:",
                        notification.notification_channel_id,
                    );
                    deleteQueuedNotification(notification.id);
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
                });
                deleteQueuedNotification(notification.id);
            } catch (error) {
                if (
                    error instanceof DiscordAPIError &&
                    error.code === RESTJSONErrorCodes.UnknownChannel
                ) {
                    deleteQueuedNotification(notification.id);
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
