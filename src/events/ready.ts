import { Events } from "discord.js";
import { CronJob } from "cron";

import client from "../index";
import fetchLatestUploads from "../utils/youtube/fetchLatestUploads";
import { config } from "../config";
// import { checkIfStreamersAreLive } from "../utils/twitch/checkIfStreamerIsLive";
import { cronUpdateBotInfo } from "../utils/cronJobs";

// Log into the bot
client.once(Events.ClientReady, async (bot) => {
    console.log(`Ready! Logged in as ${bot.user?.tag}`);

    // Set the bot's presence and update it every minute
    await cronUpdateBotInfo();
    fetchLatestUploads();

    // Set the bot's presence and update it every minute
    new CronJob("0 * * * * *", async () => {
        await cronUpdateBotInfo();
    }).start();
    setInterval(fetchLatestUploads, config.updateIntervalYouTube as number);

    // One at a time
    // checkIfStreamersAreLive();
    // setInterval(checkIfStreamersAreLive, config.updateIntervalTwitch as number);
});
