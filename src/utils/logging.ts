import type { Platforms } from "../types/types";

export async function logMessage(
    platform: Platforms,
    channelName: string,
    channelId: string,
    guildName: string,
    guildId: string,
) {
    const platformEmojis: { [key in Platforms]: string } = {
        YouTube: "❤️",
        Twitch: "💜",
    };

    const actionMessages: { [key in Platforms]: string } = {
        YouTube: "upload",
        Twitch: "live",
    };

    console.log(
        `${platformEmojis[platform]} [${platform}] Sent ${actionMessages[platform]} message to ${guildName} (${guildId}) for channel ${channelName} (${channelId})`,
    );
}
