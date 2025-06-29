import { Events } from "discord.js";
import { CronJob } from "cron";

import client from "../index";
import { config } from "../config";
// import { checkIfStreamersAreLive } from "../utils/twitch/checkIfStreamerIsLive";
import { cronUpdateBotInfo } from "../utils/cronJobs";
import sendLatestUploads from "../utils/youtube/sendLatestUploads";
import fetchLatestUploads from "../utils/youtube/fetchLatestUploads";

// Log into the bot
client.once(Events.ClientReady, async (bot) => {
    console.log(`Ready! Logged in as ${bot.user?.tag}`);

    await cronUpdateBotInfo();
    new CronJob("0 * * * * *", async () => {
        await cronUpdateBotInfo();
    }).start();

    fetchLatestUploads();
    setInterval(fetchLatestUploads, config.updateIntervalYouTube as number);

    sendLatestUploads();
    setInterval(sendLatestUploads, config.updateIntervalYouTube as number);

    // One at a time
    // checkIfStreamersAreLive();
    // setInterval(checkIfStreamersAreLive, config.updateIntervalTwitch as number);
});