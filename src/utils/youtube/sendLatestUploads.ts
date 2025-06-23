import { ChannelType, TextChannel } from "discord.js";

import client from "../..";

import { updates } from "./fetchLatestUploads";

export default async function sendLatestUploads() {
    for (const [videoId, update] of updates.entries()) {
        const channelInfo = update.channelInfo;
        const discordGuildsToUpdate = update.discordGuildsToUpdate;

        console.log("Discord guilds to update:", discordGuildsToUpdate);
        for (const guild of discordGuildsToUpdate) {
            try {
                const channelObj = await client.channels.fetch(
                    guild.guild_channel_id,
                );

                if (
                    !channelObj ||
                    (channelObj.type !== ChannelType.GuildText &&
                        channelObj.type !== ChannelType.GuildAnnouncement)
                ) {
                    console.error(
                        "Invalid channel or not a text channel in fetchLatestUploads",
                    );
                    continue;
                }

                await (channelObj as TextChannel).send({
                    content:
                        guild.guild_ping_role && channelInfo
                            ? `<@&${guild.guild_ping_role}> New video uploaded for ${channelInfo?.channelName}! https://www.youtube.com/watch?v=${videoId}`
                            : guild.guild_ping_role
                              ? `<@&${guild.guild_ping_role}> New video uploaded! https://www.youtube.com/watch?v=${videoId}`
                              : channelInfo
                                ? `New video uploaded for ${channelInfo.channelName}! https://www.youtube.com/watch?v=${videoId}`
                                : `New video uploaded! https://www.youtube.com/watch?v=${videoId}`,
                });
            } catch (error) {
                console.error(
                    "Error fetching or sending message to channel in fetchLatestUploads:",
                    error,
                );
            }
        }
        // Remove the processed entry from the updates map
        updates.delete(videoId);
    }
}
