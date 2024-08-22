// Check if all the required environment variables are set
import { env } from './config.ts';

if (!env.discordToken || env.discordToken === 'YOUR_DISCORD_TOKEN') {
	throw new Error('You MUST provide a discord token in .env!');
}

if (!env.youtubeApiKey || env.youtubeApiKey === 'YOUR_YOUTUBE_API_KEY') {
	throw new Error('You MUST provide a YouTube API key in .env!');
}

if (!env.mysqlAddress || env.mysqlAddress === 'YOUR_MYSQL_SERVER_ADDRESS') {
	throw new Error('You MUST provide a MySQL server address in .env!');
}

if (!env.mysqlPort || env.mysqlPort === 'YOUR_MYSQL_SERVER_PORT') {
	throw new Error('You MUST provide a MySQL server port in .env!');
}

if (!env.mysqlUser || env.mysqlUser === 'YOUR_MYSQL_USER') {
	throw new Error('You MUST provide a MySQL user in .env!');
}

if (!env.mysqlPassword || env.mysqlPassword === 'YOUR_MYSQL_PASSWORD') {
	throw new Error('You MUST provide a MySQL password in .env!');
}

if (!env.mysqlDatabase || env.mysqlDatabase === 'YOUR_DATABASE_NAME') {
	throw new Error('You MUST provide a database name in .env!');
}

if (!env.twitchClientId || env.twitchClientId === 'YOUR_TWITCH_CLIENT_ID') {
	throw new Error('You MUST provide a Twitch client ID in .env!');
}

if (!env.twitchClientSecret || env.twitchClientSecret === 'YOUR_TWITCH_CLIENT_SECRET') {
	throw new Error('You MUST provide a Twitch client secret in .env!');
}

await getTwitchToken();
console.log(await getStreamerName("57519051"))

// If everything is set up correctly, continue with the bot
import { Client, GatewayIntentBits, REST, Routes, type APIApplicationCommand } from 'discord.js';
import commandsMap from './commands.ts';
import fs from 'fs/promises';
import path from 'path';
import { initTables } from './database.ts';
import { getTwitchToken } from './utils/twitch/auth.ts';
import { getStreamerName } from './utils/twitch/getStreamerName.ts';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
	]
});

// Update the commands
console.log(`Refreshing ${commandsMap.size} commands`);
const rest = new REST().setToken(env.discordToken);
const getAppId: { id?: string | null } = (await rest.get(
	Routes.currentApplication(),
)) || { id: null };
if (!getAppId?.id)
	throw "No application ID was able to be found with this token";

const data = (await rest.put(Routes.applicationCommands(getAppId.id), {
	body: [...commandsMap.values()].map((a) => {
		return a.data;
	}),
})) as APIApplicationCommand[];

console.log(`Successfully reloaded ${data.length} application (/) commands.`);

// Check if MySQL is set up properly and its working
if (!await initTables()) {
	throw new Error('Error initializing tables');
}

// Get Twitch token
if (!await getTwitchToken()) {
	throw new Error('Error getting Twitch token');
}

// Login to Discord
client.login(env.discordToken);

export default client

// Import events
const getEvents = await fs.readdir(path.resolve(__dirname, './events'));
await Promise.all(getEvents.map(async (file) => {
	await import('./events/' + file);
}));
