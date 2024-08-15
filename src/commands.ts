import { heapStats } from 'bun:jsc';
import client from '.';
import { ChannelType, GuildMember, type CommandInteraction } from 'discord.js';
import checkIfChannelIdIsValid from './utils/checkIfChannelIdIsValid';
import { addNewChannelToTrack, addNewGuildToTrackChannel, checkIfChannelIsAlreadyTracked, checkIfGuildIsTrackingChannelAlready, stopGuildTrackingChannel } from './database';
import getChannelDetails from './utils/getChannelDetails';
import { PermissionFlagsBits } from 'discord-api-types/v8';

interface Command {
	data: {
		options: any[];
		name: string;
		description: string;
		integration_types: number[];
		contexts: number[];
	};
	execute: (interaction: CommandInteraction) => Promise<void>;
}

const commands: Record<string, Command> = {
	ping: {
		data: {
			options: [],
			name: 'ping',
			description: 'Check the ping of the bot!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await interaction
				.reply({
					ephemeral: false,
					content: `Ping: ${interaction.client.ws.ping}ms`,
				})
				.catch(console.error);
		},
	},
	help: {
		data: {
			options: [],
			name: 'help',
			description: 'Get help on what each command does!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await client.application?.commands?.fetch().catch(console.error);
			const chat_commands = client.application?.commands.cache.map((a) => {
				return `</${a.name}:${a.id}>: ${a.description}`;
			});
			await interaction
				.reply({
					ephemeral: true,
					content: `Commands:\n${chat_commands?.join('\n')}`,
				})
				.catch(console.error);
		},
	},
	sourcecode: {
		data: {
			options: [],
			name: 'sourcecode',
			description: "Get the link of the app's source code.",
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await interaction
				.reply({
					ephemeral: true,
					content: `[Github repository](https://github.com/GalvinPython/feedr)`,
				})
				.catch(console.error);
		},
	},
	uptime: {
		data: {
			options: [],
			name: 'uptime',
			description: 'Check the uptime of the bot!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			await interaction
				.reply({
					ephemeral: false,
					content: `Uptime: ${(performance.now() / (86400 * 1000)).toFixed(
						2,
					)} days`,
				})
				.catch(console.error);
		},
	},
	usage: {
		data: {
			options: [],
			name: 'usage',
			description: 'Check the heap size and disk usage of the bot!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			const heap = heapStats();
			Bun.gc(false);
			await interaction
				.reply({
					ephemeral: false,
					content: [
						`Heap size: ${(heap.heapSize / 1024 / 1024).toFixed(2)} MB / ${(
							heap.heapCapacity /
							1024 /
							1024
						).toFixed(2)} MB (${(heap.extraMemorySize / 1024 / 1024).toFixed(2,)} MB) (${heap.objectCount.toLocaleString()} objects, ${heap.protectedObjectCount.toLocaleString()} protected-objects)`,
					]
						.join('\n')
						.slice(0, 2000),
				})
				.catch(console.error);
		},
	},
	track: {
		data: {
			options: [{
				name: 'youtube_channel',
				description: 'Enter the YouTube channel ID to track',
				type: 3,
				required: true,
			}, {
				name: 'updates_channel',
				description: 'Enter the Guild channel to recieve updates in.',
				type: 7,
				required: true,
			}, {
				name: 'role',
				description: 'Enter the role to mention (optional)',
				type: 8,
				required: false,
			}],
			name: 'track',
			description: 'Track a channel to get notified when they upload a video!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			// Get the YouTube Channel ID
			const youtubeChannelId = interaction.options.get('youtube_channel')?.value as string;
			const discordChannelId = interaction.options.get('updates_channel')?.value as string;
			const guildId = interaction.guildId;

			// Deferring the reply is not the best practice,
			// but in case the network/database is slow, it's better to defer the reply
			// so we don't get a timeout error
			await interaction.deferReply();

			// DMs are currently not supported, so throw back an error
			if (!guildId || interaction.channel?.isDMBased()) {
				await interaction.followUp({
					ephemeral: true,
					content: 'This command is not supported in DMs currently!\nNot a DM? Then an error has occurred :(',
				});
				return;
			}

			// First check the permissions of the user
			if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
				await interaction.followUp({
					ephemeral: true,
					content: 'You do not have the permission to manage channels!',
				});
				return;
			}

			// Check if the bot has the required permissions for the target channel
			const targetChannel = await client.channels.fetch(discordChannelId);
			if (targetChannel && (targetChannel.type === ChannelType.GuildText || targetChannel.type === ChannelType.GuildAnnouncement)) {
				const botPermissions = targetChannel.permissionsFor(client.user?.id as unknown as GuildMember);
				if (
					!botPermissions?.has(PermissionFlagsBits.ViewChannel) ||
					!botPermissions?.has(PermissionFlagsBits.SendMessages) ||
					!botPermissions?.has(PermissionFlagsBits.SendMessagesInThreads) ||
					!botPermissions?.has(PermissionFlagsBits.EmbedLinks) ||
					!botPermissions?.has(PermissionFlagsBits.AttachFiles) ||
					!botPermissions?.has(PermissionFlagsBits.AddReactions)
				) {
					await interaction.followUp({
						ephemeral: true,
						content: 'The bot does not have the required permissions for the target channel!',
					});
					return;
				}
			} else {
				await interaction.followUp({
					ephemeral: true,
					content: 'The target channel is not a text channel!',
				});
				return;
			}

			// Check if the channel is valid
			if (!await checkIfChannelIdIsValid(youtubeChannelId)) {
				await interaction.followUp({
					ephemeral: true,
					content: 'Invalid YouTube channel ID!',
				});
				return;
			}

			// Check if the channel is already being tracked in the guild
			if (await checkIfGuildIsTrackingChannelAlready(youtubeChannelId, guildId)) {
				await interaction.followUp({
					ephemeral: true,
					content: 'This channel is already being tracked!',
				});
				return;
			}

			// Check if the channel is already being tracked globally
			if (!await checkIfChannelIsAlreadyTracked(youtubeChannelId)) {
				if (!await addNewChannelToTrack(youtubeChannelId)) {
					await interaction.followUp({
						ephemeral: true,
						content: 'An error occurred while trying to add the channel to track! This is a new channel being tracked globally, please report this error!',
					});
					return;
				}
			}

			// Add the guild to the database
			if (await addNewGuildToTrackChannel(guildId, youtubeChannelId, discordChannelId, interaction.options.get('role')?.value as string ?? null)) {
				const channelIdInfo = await client.channels.fetch(discordChannelId);
				if (channelIdInfo && (channelIdInfo.type === ChannelType.GuildText || channelIdInfo.type === ChannelType.GuildAnnouncement)) {
					const youtubeChannelInfo = await getChannelDetails(youtubeChannelId)

					await interaction.followUp({
						ephemeral: true,
						content: `Started tracking the channel ${youtubeChannelInfo?.channelName ?? youtubeChannelId} in ${channelIdInfo.name}!`,
					});
				} else {
					await interaction.followUp({
						ephemeral: true,
						content: 'The channel to send updates to is not a text channel! Please make sure to set a text channel!',
					});
				}
				return;
			}
		}
	},
	untrack: {
		data: {
			options: [{
				name: 'youtube_channel',
				description: 'Enter the YouTube channel ID to stop tracking',
				type: 3,
				required: true,
			}],
			name: 'untrack',
			description: 'Stop a channel from being tracked in this guild!',
			integration_types: [0, 1],
			contexts: [0, 1, 2],
		},
		execute: async (interaction: CommandInteraction) => {
			// Get the YouTube Channel ID
			const youtubeChannelId = interaction.options.get('youtube_channel')?.value as string;
			const guildId = interaction.guildId;

			// Deferring the reply is not the best practice,
			// but in case the network/database is slow, it's better to defer the reply
			// so we don't get a timeout error
			await interaction.deferReply();

			// DMs are currently not supported, so throw back an error
			if (!guildId || interaction.channel?.isDMBased()) {
				await interaction.followUp({
					ephemeral: true,
					content: 'This command is not supported in DMs currently!\nNot a DM? Then an error has occurred :(',
				});
				return;
			}

			// First check the permissions of the user
			if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
				await interaction.followUp({
					ephemeral: true,
					content: 'You do not have the permission to manage channels!',
				});
				return;
			}

			// Check if the channel is already being tracked in the guild
			if (!await checkIfGuildIsTrackingChannelAlready(youtubeChannelId, guildId)) {
				await interaction.followUp({
					ephemeral: true,
					content: 'This channel is not being tracked in this guild!',
				});
				return;
			}

			// Add the guild to the database
			if (await stopGuildTrackingChannel(guildId, youtubeChannelId)) {
				await interaction.followUp({
					ephemeral: true,
					content: 'Successfully stopped tracking the channel!',
				});
			} else {
				await interaction.followUp({
					ephemeral: true,
					content: 'An error occurred while trying to stop tracking the channel! Please report this error!',
				});
			}
			return;
		}
	}
};

// Convert commands to a Map
const commandsMap = new Map<string, Command>();
for (const key in commands) {
	if (Object.prototype.hasOwnProperty.call(commands, key)) {
		const command = commands[key];
		console.log('loading ' + key);
		commandsMap.set(key, command);
	}
}

export default commandsMap;