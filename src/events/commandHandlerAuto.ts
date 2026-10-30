import { Events } from "discord.js";

import client from "../client";
import commandsMap from "../commands";

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isAutocomplete()) {
        const getCommand = commandsMap.get(interaction.commandName);

        if (!getCommand?.autoComplete)
            return console.log(
                `${interaction.user.displayName} tried to do autocomplete for /${interaction.commandName} (${interaction.commandId}) but it wasn't found.`,
            );

        try {
            await getCommand.autoComplete(interaction);
        } catch (error) {
            console.error("Command autoComplete failed:", error);
            if (!interaction.responded) await interaction.respond([]);
        }
    }
});
