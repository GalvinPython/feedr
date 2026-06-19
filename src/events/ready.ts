import { Events } from "discord.js";
// import { CronJob } from "cron";

import client from "../client";
import { config } from "../config";
// import { cronUpdateBotInfo } from "../utils/cronJobs";
import sendLatestUploads from "../utils/youtube/sendLatestUploads";
import fetchLatestUploads from "../utils/youtube/fetchLatestUploads";
import { checkIfStreamersAreLive } from "../utils/twitch/checkIfStreamerIsLive";

// Log into the bot
client.once(Events.ClientReady, async (bot) => {
    console.log(`Ready! Logged in as ${bot.user?.tag}`);

    // TODO: Reimplement this when the bot is ready
    // await cronUpdateBotInfo();
    // new CronJob("0 * * * * *", async () => {
    //     await cronUpdateBotInfo();
    // }).start();

    console.log(
        `Setting intervals: YouTube - ${config.updateIntervalYouTube}ms, Twitch - ${config.updateIntervalTwitch}ms`,
    );

    fetchLatestUploads();
    setInterval(fetchLatestUploads, config.updateIntervalYouTube as number);

    sendLatestUploads();
    setInterval(sendLatestUploads, config.updateIntervalYouTube as number);

    checkIfStreamersAreLive();
    setInterval(checkIfStreamersAreLive, config.updateIntervalTwitch as number);
});
