import { Events } from "discord.js";
import client from "..";

import commandsMap from "../commands";

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const getCommand = commandsMap.get(interaction.commandName);
		if (!getCommand) {
			return console.log(`Command ${interaction.commandName} not found`);
		}
		return getCommand.execute(interaction);
	}
});