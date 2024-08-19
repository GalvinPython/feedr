import { ActivityType, Events, PresenceUpdateStatus } from 'discord.js';
import client from '../index';
import fetchLatestUploads from '../utils/youtube/fetchLatestUploads';
import { config } from '../config';
import { checkIfStreamersAreLive } from '../utils/twitch/checkIfStreamerIsLive';

// update the bot's presence
function updatePresence() {
	if (!client?.user) return;
	client.user.setPresence({
		activities: [
			{
				name: `Notifying ${client.guilds.cache.size} servers [${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString('en-US')} members]`,
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
	updatePresence();
	fetchLatestUploads();
	setInterval(updatePresence, 60000);
	setInterval(fetchLatestUploads, config.updateIntervalYouTube as number);
	checkIfStreamersAreLive();
	setInterval(checkIfStreamersAreLive, config.updateIntervalTwitch as number);
});
