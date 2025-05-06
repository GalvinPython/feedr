import { ActivityType, Events, PresenceUpdateStatus } from "discord.js";

import client from "../index";
import fetchLatestUploads from "../utils/youtube/fetchLatestUploads";
import { config } from "../config";
import { updateBotInfo } from "../utils/database";

// update the bot's presence
async function updatePresence() {
    if (!client?.user) return;

    const servers = client.guilds.cache.size;
    const members = client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0,
    );

    await updateBotInfo(servers, members);
    client.user.setPresence({
        activities: [
            {
                name: `Notifying ${servers.toLocaleString()} servers [${members.toLocaleString()} members]`,
                type: ActivityType.Custom,
            },
        ],
        status: PresenceUpdateStatus.Online,
    });
}

// Log into the bot
client.once(Events.ClientReady, async (bot) => {
    console.log(`Ready! Logged in as ${bot.user?.tag}`);

    // Set the bot's presence and update it every minute
    await updatePresence();
    fetchLatestUploads();
    setInterval(updatePresence, 60000);
    setInterval(fetchLatestUploads, config.updateIntervalYouTube as number);
    // One at a time
    // checkIfStreamersAreLive();
    // setInterval(checkIfStreamersAreLive, config.updateIntervalTwitch as number);
});
