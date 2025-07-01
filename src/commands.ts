import Bun from "bun";
import { heapStats } from "bun:jsc";
import {
    ApplicationCommandType,
    AutocompleteInteraction,
    ChannelType,
    ChatInputCommandInteraction,
    GuildMember,
    MessageFlags,
    type ApplicationCommandOptionData,
    type CacheType,
    type CommandInteraction,
} from "discord.js";
import { PermissionFlagsBits } from "discord-api-types/v8";

import checkIfChannelIdIsValid from "./utils/youtube/checkIfChannelIdIsValid";
import {
    addNewGuildToTrackChannel,
    checkIfGuildIsTrackingChannelAlready,
    getAllTrackedInGuild,
    stopGuildTrackingChannel,
    twitchAddNewChannelToTrack,
    twitchAddNewGuildToTrackChannel,
    twitchCheckIfChannelIsAlreadyTracked,
    twitchStopGuildTrackingChannel,
} from "./utils/database";
import getChannelDetails from "./utils/youtube/getChannelDetails";
import { getStreamerId } from "./utils/twitch/getStreamerId";
import { checkIfStreamerIsLive } from "./utils/twitch/checkIfStreamerIsLive";
import {
    checkIfChannelIsAlreadyTracked,
    addNewChannelToTrack,
} from "./utils/db/youtube";
import search from "./utils/youtube/search";

import client from ".";

interface Command {
    data: {
        name: string;
        description: string;
        options?: ApplicationCommandOptionData[];
        integration_types?: number[];
        contexts?: number[];
        type?: ApplicationCommandType;
    };
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autoComplete?: (
        interaction: AutocompleteInteraction<CacheType>,
    ) => Promise<any>;
}

const commands: Record<string, Command> = {
    ping: {
        data: {
            options: [],
            name: "ping",
            description: "Check the ping of the bot!",
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
            name: "help",
            description: "Get help on what each command does!",
            integration_types: [0, 1],
            contexts: [0, 1, 2],
        },
        execute: async (interaction: CommandInteraction) => {
            await client.application?.commands?.fetch().catch(console.error);
            const chat_commands = client.application?.commands.cache.map(
                (a) => {
                    return `</${a.name}:${a.id}>: ${a.description}`;
                },
            );

            await interaction
                .reply({
                    flags: MessageFlags.Ephemeral,
                    content: `Commands:\n${chat_commands?.join("\n")}`,
                })
                .catch(console.error);
        },
    },
    sourcecode: {
        data: {
            options: [],
            name: "sourcecode",
            description: "Get the link of the app's source code.",
            integration_types: [0, 1],
            contexts: [0, 1, 2],
        },
        execute: async (interaction: CommandInteraction) => {
            await interaction
                .reply({
                    flags: MessageFlags.Ephemeral,
                    content: `[Github repository](https://github.com/GalvinPython/feedr)`,
                })
                .catch(console.error);
        },
    },
    uptime: {
        data: {
            options: [],
            name: "uptime",
            description: "Check the uptime of the bot!",
            integration_types: [0, 1],
            contexts: [0, 1, 2],
        },
        execute: async (interaction: CommandInteraction) => {
            await interaction
                .reply({
                    ephemeral: false,
                    content: `Uptime: ${(
                        performance.now() /
                        (86400 * 1000)
                    ).toFixed(2)} days`,
                })
                .catch(console.error);
        },
    },
    usage: {
        data: {
            options: [],
            name: "usage",
            description:
                "Check the heap size and disk usage of the bot! (Stats for nerds)",
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
                        ).toFixed(
                            2,
                        )} MB (${(heap.extraMemorySize / 1024 / 1024).toFixed(2)} MB) (${heap.objectCount.toLocaleString()} objects, ${heap.protectedObjectCount.toLocaleString()} protected-objects)`,
                    ]
                        .join("\n")
                        .slice(0, 2000),
                })
                .catch(console.error);
        },
    },
    track: {
        data: {
            options: [
                {
                    name: "platform",
                    description: "Select a supported platform to track",
                    type: 3,
                    required: true,
                    choices: [
                        {
                            name: "Twitch",
                            value: "twitch",
                        },
                        {
                            name: "YouTube",
                            value: "youtube",
                        },
                    ],
                },
                {
                    name: "user_id",
                    description:
                        "Enter the YouTube channel ID or Twitch Streamer to track",
                    type: 3,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: "updates_channel",
                    description:
                        "Enter the Guild channel to receive updates in.",
                    type: 7,
                    required: false,
                },
                {
                    name: "role",
                    description: "Enter the role to mention (optional)",
                    type: 8,
                    required: false,
                },
            ],
            name: "track",
            description:
                "Track a channel to get notified when they upload a video!",
            integration_types: [0, 1],
            contexts: [0, 1, 2],
        },
        execute: async (interaction: CommandInteraction) => {
            // Get the YouTube Channel ID
            const targetPlatform = interaction.options.get("platform")
                ?.value as string;
            const platformUserId = interaction.options.get("user_id")
                ?.value as string;
            const discordChannelId =
                (interaction.options.get("updates_channel")?.value as string) ??
                interaction.channelId;
            const guildId = interaction.guildId;

            // Log the autocomplete value
            console.log(`Autocomplete value: ${platformUserId}`);

            // Checks if the platform is valid ig
            if (targetPlatform != "youtube" && targetPlatform != "twitch") {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "Platform not supported! Please select a platform to track!",
                });

                return;
            }

            // DMs are currently not supported, so throw back an error
            if (!guildId || interaction.channel?.isDMBased()) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "This command is not supported in DMs currently!\nNot a DM? Then the bot failed to get the guild info",
                });

                return;
            }

            // Check the permissions of the user
            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.ManageChannels,
                )
            ) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "You do not have the permission to manage channels!",
                });

                return;
            }

            // Check if the bot has the required permissions for the target channel
            const targetChannel = await client.channels.fetch(discordChannelId);

            if (
                targetChannel &&
                (targetChannel.type === ChannelType.GuildText ||
                    targetChannel.type === ChannelType.GuildAnnouncement)
            ) {
                const requiredPermissions = [
                    {
                        flag: PermissionFlagsBits.ViewChannel,
                        name: "View Channel",
                    },
                    {
                        flag: PermissionFlagsBits.SendMessages,
                        name: "Send Messages",
                    },
                    {
                        flag: PermissionFlagsBits.SendMessagesInThreads,
                        name: "Send Messages in Threads",
                    },
                    {
                        flag: PermissionFlagsBits.EmbedLinks,
                        name: "Embed Links",
                    },
                    {
                        flag: PermissionFlagsBits.AttachFiles,
                        name: "Attach Files",
                    },
                    {
                        flag: PermissionFlagsBits.AddReactions,
                        name: "Add Reactions",
                    },
                ];
                const botPermissions = targetChannel.permissionsFor(
                    client.user?.id as unknown as GuildMember,
                );
                const missingPermissions = requiredPermissions
                    .filter(
                        (permission) => !botPermissions?.has(permission.flag),
                    )
                    .map((permission) => permission.name);

                if (missingPermissions.length > 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        content: `The bot does not have the required permissions for the target channel! Missing permissions: ${missingPermissions.join(", ")}`,
                    });

                    return;
                }
            } else {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content: "The target channel is not a text channel!",
                });

                return;
            }

            switch (targetPlatform) {
                case "youtube": {
                    // Check that the channel ID is in a valid format
                    if (
                        platformUserId.length != 24 ||
                        !platformUserId.startsWith("UC")
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                'Invalid YouTube channel ID format! Each channel ID should be 24 characters long and start with "UC". Handles are currently not supported. Need to find the channel ID? We have a guide here: https://github.com/GalvinPython/feedr/wiki/Guide:-How-to-get-the-YouTube-Channel-ID',
                        });

                        return;
                    }

                    // Check if the channel is valid
                    if (!(await checkIfChannelIdIsValid(platformUserId))) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: "That channel doesn't exist!",
                        });

                        return;
                    }

                    const trackedChannels =
                        await checkIfGuildIsTrackingChannelAlready(
                            platformUserId,
                            guildId,
                        );

                    // Check if the channel is already being tracked in the guild
                    if (trackedChannels.length) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `This channel is already being tracked in ${trackedChannels.map((channel, index) => `${index > 0 && index === trackedChannels.length - 1 ? "and " : ""}<#${channel.guild_channel_id}>`).join(", ")}!`,
                        });

                        return;
                    }

                    // Check if the channel is already being tracked globally
                    if (
                        !(await checkIfChannelIsAlreadyTracked(platformUserId))
                    ) {
                        if (!(await addNewChannelToTrack(platformUserId))) {
                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                content:
                                    "An error occurred while trying to add the channel to track! This is a new channel being tracked globally, please report this error!",
                            });

                            return;
                        }
                    }

                    // Add the guild to the database
                    if (
                        await addNewGuildToTrackChannel(
                            guildId,
                            platformUserId,
                            discordChannelId,
                            (interaction.options.get("role")
                                ?.value as string) ?? null,
                        )
                    ) {
                        const youtubeChannelInfo =
                            await getChannelDetails(platformUserId);

                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `Started tracking the channel ${youtubeChannelInfo?.channelName ?? platformUserId} in ${targetChannel.name}!`,
                        });
                    } else {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to add the guild to track the channel! Please report this error!",
                        });
                    }

                    return;
                }
                case "twitch": {
                    // Check if the streamer exists by getting the ID
                    const streamerId = await getStreamerId(platformUserId);

                    if (!streamerId) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: "That streamer doesn't exist!",
                        });

                        return;
                    }

                    const trackedChannels =
                        await checkIfGuildIsTrackingChannelAlready(
                            platformUserId,
                            guildId,
                        );

                    // Check if the channel is already being tracked in the guild
                    if (trackedChannels.length) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `This channel is already being tracked in ${trackedChannels.map((channel, index) => `${index > 0 && index === trackedChannels.length - 1 ? "and " : ""}<#${channel.guild_channel_id}>`).join(", ")}!`,
                        });

                        return;
                    }

                    // Check if the channel is already being tracked globally
                    if (
                        !(await twitchCheckIfChannelIsAlreadyTracked(
                            streamerId,
                        ))
                    ) {
                        const isLive = await checkIfStreamerIsLive(streamerId);

                        if (
                            !(await twitchAddNewChannelToTrack(
                                streamerId,
                                isLive,
                            ))
                        ) {
                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                content:
                                    "An error occurred while trying to add the streamer to track! This is a new streamer being tracked globally, please report this error!",
                            });

                            return;
                        }
                    }

                    // Add the guild to the database
                    if (
                        await twitchAddNewGuildToTrackChannel(
                            guildId,
                            streamerId,
                            discordChannelId,
                            (interaction.options.get("role")
                                ?.value as string) ?? null,
                        )
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `Started tracking the streamer ${platformUserId} (${streamerId}) in ${targetChannel.name}!`,
                        });
                    } else {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to add the guild to track the streamer! Please report this error!",
                        });
                    }

                    return;
                }
                default:
                    console.error("This should never happen");
                    break;
            }
        },
        autoComplete: async (interaction: AutocompleteInteraction) => {
            try {
                const platform = interaction.options.get("platform")?.value;
                const query = interaction.options.get("user_id")?.value;

                // If the query is empty or not a string, return an empty array
                if (!query || typeof query !== "string") {
                    await interaction.respond([]);

                    return;
                }

                // If the query is a YouTube channel ID, do not search
                if (query.length == 24 && query.startsWith("UC")) {
                    await interaction.respond([
                        {
                            name: `${query} (using channel id)`,
                            value: query,
                        },
                    ]);

                    return;
                }

                const channels = await search(query);

                await interaction.respond(
                    channels.map((channel) => ({
                        name: `${channel.title} (${channel.handle}) | ${channel.subscribers} subscriber(s)`.slice(
                            0,
                            100,
                        ),
                        value: channel.channel_id,
                    })),
                );
            } catch (error) {
                console.error(error);
            }
        },
    },
    untrack: {
        data: {
            options: [
                {
                    name: "platform",
                    description: "Select a supported platform to track",
                    type: 3,
                    required: true,
                    choices: [
                        {
                            name: "Twitch",
                            value: "twitch",
                        },
                        {
                            name: "YouTube",
                            value: "youtube",
                        },
                    ],
                },
                {
                    name: "user_id",
                    description:
                        "Enter the YouTube/Twitch channel ID to stop tracking",
                    type: 3,
                    required: true,
                },
            ],
            name: "untrack",
            description: "Stop a channel from being tracked in this guild!",
            integration_types: [0, 1],
            contexts: [0, 1],
        },
        execute: async (interaction: CommandInteraction) => {
            // Get the YouTube Channel ID
            const youtubeChannelId = interaction.options.get("user_id")
                ?.value as string;
            const platform = interaction.options.get("platform")
                ?.value as string;
            const guildId = interaction.guildId;

            // DMs are currently not supported, so throw back an error
            if (!guildId || interaction.channel?.isDMBased()) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "This command is not supported in DMs currently!\nNot a DM? Then an error has occurred :(",
                });

                return;
            }

            // Check the permissions of the user
            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.ManageChannels,
                )
            ) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "You do not have the permission to manage channels!",
                });

                return;
            }

            // Platform check (to shut up TS)
            if (platform != "youtube" && platform != "twitch") {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "Platform not supported! Please select a platform to track!",
                });

                return;
            }

            // Remove the guild from the database
            switch (platform) {
                case "youtube":
                    // Check if the channel is not being tracked in the guild
                    if (
                        !(await checkIfGuildIsTrackingChannelAlready(
                            youtubeChannelId,
                            guildId,
                        ))
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "This channel is not being tracked in this guild!",
                        });

                        return;
                    }
                    if (
                        await stopGuildTrackingChannel(
                            guildId,
                            youtubeChannelId,
                        )
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "Successfully stopped tracking the channel!",
                        });
                    } else {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to stop tracking the channel! Please report this error!",
                        });
                    }

                    return;
                case "twitch": {
                    // get the twitch id for the streamer
                    const streamerId = await getStreamerId(youtubeChannelId);

                    if (!streamerId) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to get the streamer ID! Please report this error!",
                        });

                        return;
                    }

                    // check if the channel is not being tracked in the guild
                    if (
                        !(await checkIfGuildIsTrackingChannelAlready(
                            streamerId,
                            guildId,
                        ))
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "This streamer is not being tracked in this guild!",
                        });

                        return;
                    }

                    if (
                        await twitchStopGuildTrackingChannel(
                            guildId,
                            streamerId,
                        )
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "Successfully stopped tracking the streamer!",
                        });
                    } else {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to stop tracking the streamer! Please report this error!",
                        });
                    }

                    return;
                }
                default:
                    return;
            }
        },
    },
    tracked: {
        data: {
            options: [],
            name: "tracked",
            description:
                "Get a list of all the channels being tracked in this guild!",
            integration_types: [0, 1],
            contexts: [0, 1],
        },
        execute: async (interaction: CommandInteraction) => {
            const guildId = interaction.guildId;
            const channelId = interaction.channelId;

            if (!guildId || !channelId) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "You are likely in a DM, this command is not supported in DMs!",
                });

                return;
            }

            const trackedChannels = await getAllTrackedInGuild(guildId);

            if (trackedChannels.length === 0) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content: "No channels are being tracked in this guild.",
                });

                return;
            }

            const filteredChannels = trackedChannels.filter(
                (channel) => channel.guild_channel_id === channelId,
            );

            const newTrackedChannels = trackedChannels.filter(
                (channel) => channel.guild_channel_id !== channelId,
            );

            // idk what is happening here anymore, but this is because eslint and prettier are fighting so i put them to rest by using only one line
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: `
## Tracked channels in this channel (<#${channelId}>):\n${filteredChannels.length ? filteredChannels.map((channel) => `Platform: ${channel.guild_platform} | User ID: ${channel.platform_user_id}`).join("\n") : "No channels are being tracked in this channel."}
                
## Other tracked channels in this guild:\n${newTrackedChannels.map((channel) => `Platform: ${channel.guild_platform} | User ID: ${channel.platform_user_id} | Channel: <#${channel.guild_channel_id}>`).join("\n")}`,
            });

            return;
        },
    },
};

// Convert commands to a Map
const commandsMap = new Map<string, Command>();

for (const key in commands) {
    if (Object.prototype.hasOwnProperty.call(commands, key)) {
        const command = commands[key];

        console.log("loading " + key);
        commandsMap.set(key, command);
    }
}

export default commandsMap;
