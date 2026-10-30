import { Events } from "discord.js";

import client from "../client";
import { dbAuditLogCreate } from "../db/audit";
import { discordRemoveGuildFromTracking } from "../db/discord";

client.on(Events.GuildDelete, async (guild) => {
    if (!guild.available) return;
    console.log(`Left guild: ${guild.name} (ID: ${guild.id})`);

    // Remove the guild from tracking
    const result = await discordRemoveGuildFromTracking(guild.id);

    if (!result.success || result.changed)
        await dbAuditLogCreate(
            guild.id,
            "guild_left",
            result.success ? "success" : "failure",
            { guildName: guild.name },
        );
    if (result.success) {
        console.log(`Successfully removed guild ${guild.id} from tracking.`);
    } else {
        console.error(`Failed to remove guild ${guild.id} from tracking.`);
    }
});
