import { Events } from "discord.js";

import client from "../client";
import { discordAddNewGuild } from "../db/discord";

client.on(Events.GuildCreate, async (guild) => {
    console.log(`Joined new guild: ${guild.name} (ID: ${guild.id})`);

    // Add the new guild to tracking
    const result = await discordAddNewGuild(guild.id);

    if (result.success) {
        console.log(`Successfully added guild ${guild.id} to tracking.`);
    } else {
        console.error(`Failed to add guild ${guild.id} to tracking.`);
    }
});
