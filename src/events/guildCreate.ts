import { Events } from "discord.js";

import client from "../client";
import { dbAuditLogCreate } from "../db/audit";
import { discordAddNewGuild } from "../db/discord";

client.on(Events.GuildCreate, async (guild) => {
    console.log(`Joined new guild: ${guild.name} (ID: ${guild.id})`);

    // Add the new guild to tracking
    const result = await discordAddNewGuild(guild.id, false);

    if (!result.success || result.changed)
        await dbAuditLogCreate(
            guild.id,
            "guild_joined",
            result.success ? "success" : "failure",
            { guildName: guild.name },
        );
    if (result.success) {
        console.log(`Successfully added guild ${guild.id} to tracking.`);
    } else {
        console.error(`Failed to add guild ${guild.id} to tracking.`);
    }
});
