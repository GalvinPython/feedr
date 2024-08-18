// FILL IN THIS INFORMATION IN .ENV
export const config: { [key: string]: string | number } = {
	updateInterval: process.env?.CONFIG_UPDATE_INTERVAL ? parseInt(process.env?.CONFIG_UPDATE_INTERVAL) * 1000 : 60_000,
}

export const env: { [key: string]: string | undefined } = {
	discordToken: process.argv.includes('--dev') ? process.env?.DISCORD_DEV_TOKEN : process.env?.DISCORD_TOKEN,
	youtubeApiKey: process.env?.YOUTUBE_API_KEY,
	mysqlAddress: process.env?.MYSQL_ADDRESS,
	mysqlPort: process.env?.MYSQL_PORT,
	mysqlUser: process.env?.MYSQL_USER,
	mysqlPassword: process.env?.MYSQL_PASSWORD,
	mysqlDatabase: process.env?.MYSQL_DATABASE,
	twitchClientId: process.env?.TWITCH_CLIENT_ID,
	twitchClientSecret: process.env?.TWITCH_CLIENT_SECRET,
};