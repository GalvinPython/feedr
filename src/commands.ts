import Bun from "bun";
import { heapStats } from "bun:jsc";
import {
    ApplicationCommandOptionType,
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
import hfksdjfskfhsjdfhkasfdhksf from "hfksdjfskfhsjdfhkasfdhksf";

import checkIfChannelIdIsValid from "./utils/youtube/checkIfChannelIdIsValid";
import getChannelDetails from "./utils/youtube/getChannelDetails";
import { checkIfStreamerIsLive } from "./utils/twitch/checkIfStreamerIsLive";
import {
    checkIfChannelIsAlreadyTracked,
    addNewChannelToTrack,
} from "./db/youtube";
import search from "./utils/youtube/search";
import {
    checkIfGuildIsTrackingUserAlready,
    discordAddGuildTrackingUser,
    discordGetAllTrackedInGuild,
} from "./db/discord";
import { Platform, YouTubeContentType } from "./types/types.d";
import searchTwitch from "./utils/twitch/searchTwitch";
import { getStreamerName } from "./utils/twitch/getStreamerName";
import {
    addNewStreamerToTrack,
    checkIfStreamerIsAlreadyTracked,
} from "./db/twitch";

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
    hmm: {
        data: {
            options: [],
            name: "hmm",
            description: "What does this command do?",
            integration_types: [0, 1],
            contexts: [0, 1],
        },
        execute: async (interaction: CommandInteraction) => {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: hfksdjfskfhsjdfhkasfdhksf(),
            });
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
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "youtube",
                    description: "Track a YouTube channel",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "channel_id",
                            description: "Enter the YouTube channel ID",
                            required: true,
                            autocomplete: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: "content_type",
                            description: "Select what content to track",
                            required: true,
                            choices: [
                                { name: "Videos Only", value: 1 },
                                { name: "Shorts Only", value: 2 },
                                { name: "Streams Only", value: 4 },
                                { name: "Videos & Shorts", value: 3 },
                                { name: "Videos & Streams", value: 5 },
                                { name: "Shorts & Streams", value: 6 },
                                { name: "Videos, Shorts, Streams", value: 7 },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "updates_channel",
                            description:
                                "Channel to receive updates. If not specified, the current channel will be used.",
                            required: false,
                        },
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: "role",
                            description: "Role to mention (optional)",
                            required: false,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "twitch",
                    description: "Track a Twitch streamer",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "streamer_id",
                            description: "Enter the Twitch streamer username",
                            required: true,
                            autocomplete: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "updates_channel",
                            description:
                                "Channel to receive updates. If not specified, the current channel will be used.",
                            required: false,
                        },
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: "role",
                            description: "Role to mention (optional)",
                            required: false,
                        },
                    ],
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
            const targetPlatform = (
                interaction as ChatInputCommandInteraction
            ).options.getSubcommand();
            const platformUserId =
                targetPlatform === "youtube"
                    ? (interaction.options.get("channel_id")?.value as string)
                    : (interaction.options.get("streamer_id")?.value as string);
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

            // TODO: Embed
            // For YouTube: Check if the channel ID is in a valid format
            if (
                targetPlatform === "youtube" &&
                (platformUserId.length !== 24 ||
                    !platformUserId.startsWith("UC"))
            ) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        'Invalid YouTube channel ID format! Each channel ID should be 24 characters long and start with "UC". Need to find the channel ID? We have a guide here: https://github.com/GalvinPython/feedr/wiki/Guide:-How-to-get-the-YouTube-Channel-ID. If this was an issue with the autocomplete, please report it!',
                });

                return;
            }

            // TODO: Enable DMs :)
            const isDm = interaction.channel?.isDMBased();

            if (!guildId || isDm || isDm === undefined) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content:
                        "This command is not supported in DMs currently!\nNot a DM? Then the bot failed to get the guild info",
                });

                return;
            }

            // TODO: Embed
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

            // TODO: Embed
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
                    const contentType = interaction.options.get("content_type")
                        ?.value as number;

                    if (!contentType) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: "Please specify a valid content type!",
                        });

                        return;
                    }

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

                    // Check content type
                    const shouldTrackVideos =
                        (contentType & YouTubeContentType.Videos) !== 0;
                    const shouldTrackShorts =
                        (contentType & YouTubeContentType.Shorts) !== 0;
                    const shouldTrackStreams =
                        (contentType & YouTubeContentType.Streams) !== 0;

                    console.log(`Tracking Videos: ${shouldTrackVideos}`);
                    console.log(`Tracking Shorts: ${shouldTrackShorts}`);
                    console.log(`Tracking Streams: ${shouldTrackStreams}`);

                    // Optional: prevent empty tracking (e.g., bitmask = 0)
                    if (
                        !shouldTrackVideos &&
                        !shouldTrackShorts &&
                        !shouldTrackStreams
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `You must select at least one type of content to track.`,
                        });

                        return;
                    }

                    // Check if the channel is already being tracked in the guild
                    const trackedChannels =
                        await checkIfGuildIsTrackingUserAlready(
                            Platform.YouTube,
                            platformUserId,
                            guildId,
                        );

                    console.log(trackedChannels);
                    if (!trackedChannels || !trackedChannels.success) {
                        // TODO: Embed
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `An error occurred while trying to check if the channel is already being tracked in this guild! Please report this error!`,
                        });

                        return;
                    } else if (
                        trackedChannels.success &&
                        trackedChannels.data
                    ) {
                        // If the channel is already being tracked in the guild, we can just return
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `This channel is already being tracked in ${trackedChannels.data.map((channel, index) => `${index > 0 && index === trackedChannels.data.length - 1 ? "and " : ""}<#${channel.guild_channel_id}>`).join(", ")}!`,
                        });

                        return;
                    }

                    // Check if the channel is already being tracked globally
                    const isChannelTracked =
                        await checkIfChannelIsAlreadyTracked(platformUserId);

                    console.log(
                        `Is channel ${platformUserId} tracked globally?`,
                        isChannelTracked,
                    );

                    if (!isChannelTracked.success) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to check if the channel is already being tracked globally! Please report this error!",
                        });
                    } else if (
                        isChannelTracked.success &&
                        isChannelTracked.data.length == 0
                    ) {
                        console.log(
                            `Channel ${platformUserId} is not tracked globally, adding it now...`,
                        );
                        const channelAdded =
                            await addNewChannelToTrack(platformUserId);

                        if (!channelAdded.success) {
                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                content:
                                    "An error occurred while trying to add the channel to track to the main YouTube database. Please report this issue!",
                            });

                            return;
                        }
                    }

                    // Add the guild to the database
                    if (
                        await discordAddGuildTrackingUser(
                            guildId,
                            Platform.YouTube,
                            platformUserId,
                            discordChannelId,
                            (interaction.options.get("role")
                                ?.value as string) ?? null,
                            isDm,
                            shouldTrackVideos,
                            shouldTrackShorts,
                            shouldTrackStreams,
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
                    const streamerName = await getStreamerName(platformUserId);

                    if (!streamerName) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "That streamer doesn't exist! Please use the autocomplete to find the correct streamer ID as this uses IDs that are not publicly visible on the Twitch site!",
                        });

                        return;
                    }

                    // Check if the channel is already being tracked in the guild
                    const trackedChannels =
                        await checkIfGuildIsTrackingUserAlready(
                            Platform.YouTube,
                            platformUserId,
                            guildId,
                        );

                    console.log(trackedChannels);
                    if (!trackedChannels || !trackedChannels.success) {
                        // TODO: Embed
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `An error occurred while trying to check if the channel is already being tracked in this guild! Please report this error!`,
                        });

                        return;
                    } else if (
                        trackedChannels.success &&
                        trackedChannels.data
                    ) {
                        // If the channel is already being tracked in the guild, we can just return
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `This channel is already being tracked in ${trackedChannels.data.map((channel, index) => `${index > 0 && index === trackedChannels.data.length - 1 ? "and " : ""}<#${channel.guild_channel_id}>`).join(", ")}!`,
                        });

                        return;
                    }

                    // Check if the channel is already being tracked globally
                    const isChannelTracked =
                        await checkIfStreamerIsAlreadyTracked(platformUserId);

                    console.log(
                        `Is channel ${platformUserId} tracked globally?`,
                        isChannelTracked,
                    );

                    if (!isChannelTracked.success) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to check if the channel is already being tracked globally! Please report this error!",
                        });
                    } else if (
                        isChannelTracked.success &&
                        isChannelTracked.data.length == 0
                    ) {
                        console.log(
                            `Channel ${platformUserId} is not tracked globally, adding it now...`,
                        );
                        const isLive =
                            await checkIfStreamerIsLive(platformUserId);
                        const channelAdded = await addNewStreamerToTrack(
                            platformUserId,
                            isLive,
                        );

                        if (!channelAdded.success) {
                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                content:
                                    "An error occurred while trying to add the channel to track to the main YouTube database. Please report this issue!",
                            });

                            return;
                        }
                    }

                    // Add the guild to the database
                    if (
                        await discordAddGuildTrackingUser(
                            guildId,
                            Platform.Twitch,
                            platformUserId,
                            discordChannelId,
                            (interaction.options.get("role")
                                ?.value as string) ?? null,
                            isDm,
                        )
                    ) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content: `Started tracking the streamer ${platformUserId} (${platformUserId}) in ${targetChannel.name}!`,
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
                const platform = (
                    interaction as unknown as ChatInputCommandInteraction
                ).options.getSubcommand();
                const query =
                    platform === "youtube"
                        ? (interaction.options.get("channel_id")
                              ?.value as string)
                        : (interaction.options.get("streamer_id")
                              ?.value as string);

                // If the query is empty or not a string, return an empty array
                if (!query || typeof query !== "string") {
                    await interaction.respond([]);

                    return;
                }

                console.log(platform, query);

                switch (platform) {
                    case "youtube": {
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

                        if (!channels || channels.length === 0) {
                            await interaction.respond([]);

                            return;
                        }

                        await interaction.respond(
                            channels.map((channel) => ({
                                name: `${channel.title} (${channel.handle}) | ${channel.subscribers} subscriber(s)`.slice(
                                    0,
                                    100,
                                ),
                                value: channel.channel_id,
                            })),
                        );

                        break;
                    }
                    case "twitch": {
                        const channels = await searchTwitch(query);

                        if (!channels || channels.length === 0) {
                            await interaction.respond([]);

                            return;
                        }

                        await interaction.respond(
                            channels.map((channel) => ({
                                name: `${channel.displayName} (${channel.loginName}) | ${channel.isLive ? "🔴" : "Offline"}`.slice(
                                    0,
                                    100,
                                ),
                                value: channel.id,
                            })),
                        );

                        break;
                    }
                    default:
                        await interaction.respond([]);
                        break;
                }
            } catch (error) {
                console.error(error);
            }
        },
    },
    untrack: {
        data: {
            options: [
                {
                    name: "user_id",
                    // TODO: Searching
                    description:
                        "Select the channel or streamer to stop tracking. Searching is not supported, use the above options!",
                    type: 3,
                    required: true,
                    autocomplete: true,
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
                        !(await checkIfGuildIsTrackingUserAlready(
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
                    const platformUserId =
                        await getplatformUserId(youtubeChannelId);

                    if (!platformUserId) {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            content:
                                "An error occurred while trying to get the streamer ID! Please report this error!",
                        });

                        return;
                    }

                    // check if the channel is not being tracked in the guild
                    if (
                        !(await checkIfGuildIsTrackingUserAlready(
                            platformUserId,
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
                            platformUserId,
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
        autoComplete: async (interaction: AutocompleteInteraction) => {
            const trackedChannels = await discordGetAllTrackedInGuild(
                interaction.guildId as string,
            );

            console.dir(
                { message: "Tracked channels:", data: trackedChannels },
                { depth: null },
            );

            if (!trackedChannels || !trackedChannels.success) {
                console.error(
                    "An error occurred while trying to get the tracked channels in this guild!",
                );
                await interaction.respond([]);

                return;
            }

            const trackedYouTubeChannels =
                trackedChannels.data.youtubeSubscriptions;
            const trackedTwitchChannels =
                trackedChannels.data.twitchSubscriptions;

            return await interaction.respond(
                trackedYouTubeChannels
                    .map((channel) => ({
                        name: `YouTube: ${channel.youtubeChannel.youtubeChannelName} (${channel.youtubeChannel.youtubeChannelId}) | <#${channel.subscription.notificationChannelId}>`,
                        value: String(channel.subscription.id),
                    }))
                    .concat(
                        trackedTwitchChannels.map((channel) => ({
                            name: `Twitch: ${channel.twitchChannel.twitchChannelName} (${channel.twitchChannel.twitchChannelId}) | <#${channel.subscription.notificationChannelId}>`,
                            value: String(channel.subscription.id),
                        })),
                    ),
            );
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
