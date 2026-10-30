import { Events } from "discord.js";

import client from "../client";
import commandsMap from "../commands";

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const getCommand = commandsMap.get(interaction.commandName);

        if (!getCommand) {
            return console.log(`Command ${interaction.commandName} not found`);
        }

        try {
            await getCommand.execute(interaction);
        } catch (error) {
            console.error("Command execute failed:", error);
            if (interaction.deferred || interaction.replied)
                await interaction.editReply({ content: "The command failed." });
            else
                await interaction.reply({
                    content: "The command failed.",
                    ephemeral: true,
                });
        }
    }
});
