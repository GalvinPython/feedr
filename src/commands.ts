import Bun from "bun";
import { heapStats } from "bun:jsc";
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ApplicationIntegrationType,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    GuildMember,
    InteractionContextType,
    MessageFlags,
    TextChannel,
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
    discordAddNewGuild,
    discordCheckIfDmChannelExists,
    discordGetAllTrackedInGuild,
    discordRemoveGuildTrackingChannel,
    discordUpdateSubscriptionAddChannel,
    discordUpdateSubscriptionCheckGuild,
    discordUpdateSubscriptionRemoveChannel,
} from "./db/discord";
import {
    Platform,
    YouTubeContentType,
    type PlatformTypes,
} from "./types/types.d";
import searchTwitch from "./utils/twitch/searchTwitch";
import { getStreamerName } from "./utils/twitch/getStreamerName";
import {
    addNewStreamerToTrack,
    checkIfStreamerIsAlreadyTracked,
} from "./db/twitch";
import { config } from "./config";
import { EmbedType, replyWithQuickEmbed } from "./utils/quickEmbed";
import client from "./client";

interface Command {
    data: {
        name: string;
        description: string;
        options?: ApplicationCommandOptionData[];
        integration_types?: ApplicationIntegrationType[];
        contexts?: InteractionContextType[];
        type?: ApplicationCommandType;
    };
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autoComplete?: (
        interaction: AutocompleteInteraction<CacheType>,
    ) => Promise<any>;
}

// Context 2: Interaction can be used within Group DMs and DMs other than the app's bot user
// /track, /tracked, /untracked and /updates can't be used in these contexts
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
            await replyWithQuickEmbed(
                interaction,
                `Ping: ${interaction.client.ws.ping}ms`,
            ).catch(console.error);
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

            await replyWithQuickEmbed(
                interaction,
                `Commands:\n${chat_commands?.join("\n")}`,
                EmbedType.Info,
                { title: "Available Commands" },
            ).catch(console.error);
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
            await replyWithQuickEmbed(
                interaction,
                `[GitHub repository](https://github.com/GalvinPython/feedr)`,
                EmbedType.Info,
                { title: "Source Code" },
            ).catch(console.error);
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
            const uptimeDays = (performance.now() / (86400 * 1000)).toFixed(2);

            await replyWithQuickEmbed(
                interaction,
                `Uptime: ${uptimeDays} days`,
                EmbedType.Info,
                { title: "Bot Uptime" },
            ).catch(console.error);
        },
    },
    hmm: {
        data: {
            options: [],
            name: "hmm",
            description: "What does this command do?",
            integration_types: [0, 1],
            contexts: [0, 1, 2],
        },
        execute: async (interaction: CommandInteraction) => {
            await replyWithQuickEmbed(interaction, hfksdjfskfhsjdfhkasfdhksf());
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
            await replyWithQuickEmbed(
                interaction,
                [
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
                EmbedType.Info,
                { title: "Usage Stats" },
            ).catch(console.error);
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
            contexts: [0, 1],
        },
        execute: async (interaction: CommandInteraction) => {
            const isDm = !interaction.inGuild();

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
            const guildId = isDm ? discordChannelId : interaction.guildId;

            // Checks if the platform is valid ig
            if (targetPlatform != "youtube" && targetPlatform != "twitch") {
                await replyWithQuickEmbed(
                    interaction,
                    "Platform not supported! Please select a platform to track!",
                    EmbedType.Error,
                );

                return;
            }

            // TODO: Embed
            // For YouTube: Check if the channel ID is in a valid format
            if (
                targetPlatform === "youtube" &&
                (platformUserId.length !== 24 ||
                    !platformUserId.startsWith("UC"))
            ) {
                await replyWithQuickEmbed(
                    interaction,
                    'Invalid YouTube channel ID format! Each channel ID should be 24 characters long and start with "UC". Need to find the channel ID? We have a guide here: https://github.com/GalvinPython/feedr/wiki/Guide:-How-to-get-the-YouTube-Channel-ID. If this was an issue with the autocomplete, please report it!',
                    EmbedType.Error,
                );

                return;
            }

            console.log(interaction.channelId);

            if (isDm) console.log("DM");

            // TODO: Embed
            // Check the permissions of the user
            if (!isDm) {
                if (
                    !interaction.memberPermissions?.has(
                        PermissionFlagsBits.ManageChannels,
                    )
                ) {
                    await replyWithQuickEmbed(
                        interaction,
                        "You need the Manage Channels permission to use /track in this server.",
                        EmbedType.Error,
                    );

                    return;
                }
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
                    await replyWithQuickEmbed(
                        interaction,
                        `I can't post tracking updates to <#${discordChannelId}>. Missing permissions: ${missingPermissions.join(", ")}.`,
                        EmbedType.Error,
                    );

                    return;
                }
            } else if (isDm) {
                // DM channels don't need permission checks
            } else {
                await replyWithQuickEmbed(
                    interaction,
                    `The selected updates channel (<#${discordChannelId}>) is not a text/announcement channel.`,
                    EmbedType.Error,
                );

                return;
            }

            // Before attempting to add the subscription, if it's a DM, check if it's already in the database. If not add it
            if (isDm) {
                const data = (
                    await discordCheckIfDmChannelExists(discordChannelId)
                ).data;

                if (!data.length) {
                    await discordAddNewGuild(discordChannelId, true);
                }
            }

            switch (targetPlatform) {
                case "youtube": {
                    const contentType = interaction.options.get("content_type")
                        ?.value as number;

                    if (!contentType) {
                        await replyWithQuickEmbed(
                            interaction,
                            `Please choose at least one YouTube content type to track for channel ${platformUserId}.`,
                            EmbedType.Error,
                        );

                        return;
                    }

                    // Check that the channel ID is in a valid format
                    if (
                        platformUserId.length != 24 ||
                        !platformUserId.startsWith("UC")
                    ) {
                        await replyWithQuickEmbed(
                            interaction,
                            'Invalid YouTube channel ID format! Each channel ID should be 24 characters long and start with "UC". Handles are currently not supported. Need to find the channel ID? We have a guide here: https://github.com/GalvinPython/feedr/wiki/Guide:-How-to-get-the-YouTube-Channel-ID',
                            EmbedType.Error,
                        );

                        return;
                    }

                    // Check if the channel is valid
                    if (!(await checkIfChannelIdIsValid(platformUserId))) {
                        await replyWithQuickEmbed(
                            interaction,
                            `The YouTube channel ID ${platformUserId} was not found.`,
                            EmbedType.Error,
                        );

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
                        await replyWithQuickEmbed(
                            interaction,
                            "You must select at least one type of content to track.",
                            EmbedType.Error,
                        );

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
                        await replyWithQuickEmbed(
                            interaction,
                            `Failed to check whether YouTube channel ${platformUserId} is already tracked in this ${isDm ? "DM" : "server"}.`,
                            EmbedType.Error,
                        );

                        return;
                    } else if (
                        trackedChannels.success &&
                        trackedChannels.data
                    ) {
                        // If the channel is already being tracked in the guild, we can just return
                        if (Array.isArray(trackedChannels.data)) {
                            const channelList = trackedChannels.data
                                .map(
                                    (channel, index, arr) =>
                                        `${index > 0 && index === arr.length - 1 ? "and " : ""}<#${channel.notificationChannelId}>`,
                                )
                                .join(", ");

                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(0xfee75c)
                                        .setTitle("Already Tracked")
                                        .setDescription(
                                            `YouTube channel ${platformUserId} is already being tracked in ${channelList}.`,
                                        ),
                                ],
                            });
                        } else {
                            await replyWithQuickEmbed(
                                interaction,
                                `YouTube channel ${platformUserId} appears to be already tracked, but the stored subscription data is invalid. This is an internal error, please report it to the developer.`,
                                EmbedType.Error,
                            );
                        }

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
                        await replyWithQuickEmbed(
                            interaction,
                            `Failed to check global tracking status for YouTube channel ${platformUserId}. This is an internal error, please report it to the developer.`,
                            EmbedType.Error,
                        );
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
                            await replyWithQuickEmbed(
                                interaction,
                                `Failed to register YouTube channel ${platformUserId} in the global tracking database. This is an internal error, please report it to the developer.`,
                                EmbedType.Error,
                            );

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
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x57f287)
                                    .setTitle("Tracking Started")
                                    .setDescription(
                                        `Started tracking the channel ${youtubeChannelInfo?.channelName ?? platformUserId} in <#${targetChannel?.id}>!`,
                                    ),
                            ],
                        });
                    } else {
                        await replyWithQuickEmbed(
                            interaction,
                            `Failed to create a YouTube subscription for channel ${platformUserId} in <#${discordChannelId}>. This is an internal error, please report it to the developer.`,
                            EmbedType.Error,
                        );
                    }

                    return;
                }

                case "twitch": {
                    // Check if the streamer exists by getting the ID
                    const streamerName = await getStreamerName(platformUserId);

                    if (!streamerName) {
                        await replyWithQuickEmbed(
                            interaction,
                            `Twitch streamer ID ${platformUserId} was not found. Use autocomplete to pick a valid streamer`,
                            EmbedType.Error,
                        );

                        return;
                    }

                    // Check if the channel is already being tracked in the guild
                    const trackedChannels =
                        await checkIfGuildIsTrackingUserAlready(
                            Platform.Twitch,
                            platformUserId,
                            guildId,
                        );

                    console.log(trackedChannels);
                    if (!trackedChannels || !trackedChannels.success) {
                        // TODO: Embed
                        await replyWithQuickEmbed(
                            interaction,
                            `Failed to check whether Twitch streamer ${streamerName ?? platformUserId} is already tracked in this ${isDm ? "DM" : "server"}.`,
                            EmbedType.Error,
                        );

                        return;
                    } else if (
                        trackedChannels.success &&
                        trackedChannels.data
                    ) {
                        // If the channel is already being tracked in the guild, we can just return
                        if (Array.isArray(trackedChannels.data)) {
                            const channelList = trackedChannels.data
                                .map(
                                    (channel, index, arr) =>
                                        `${index > 0 && index === arr.length - 1 ? "and " : ""}<#${channel.notificationChannelId}>`,
                                )
                                .join(", ");

                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(0xfee75c)
                                        .setTitle("Already Tracked")
                                        .setDescription(
                                            `Twitch streamer ${streamerName} is already being tracked in ${channelList}.`,
                                        ),
                                ],
                            });
                        } else {
                            await replyWithQuickEmbed(
                                interaction,
                                `Twitch streamer ${streamerName} appears to be already tracked, but the stored subscription data is invalid.`,
                                EmbedType.Error,
                            );
                        }

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
                        await replyWithQuickEmbed(
                            interaction,
                            `Failed to check global tracking status for Twitch streamer ${streamerName}.`,
                            EmbedType.Error,
                        );
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
                            streamerName,
                        );

                        if (!channelAdded.success) {
                            await replyWithQuickEmbed(
                                interaction,
                                `Failed to register Twitch streamer ${streamerName} in the global tracking database.`,
                                EmbedType.Error,
                            );

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
                        await replyWithQuickEmbed(
                            interaction,
                            `Started tracking the streamer ${streamerName} in <#${targetChannel?.id}>!`,
                            EmbedType.Success,
                            { title: "Tracking Started" },
                        );
                    } else {
                        await replyWithQuickEmbed(
                            interaction,
                            `Failed to create a Twitch subscription for streamer ${streamerName} in <#${discordChannelId}>.`,
                            EmbedType.Error,
                        );
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
            const isDm = !interaction.inGuild();

            // Get the YouTube Channel ID
            const platformUserId = interaction.options.get("user_id")
                ?.value as string;
            const [platform, trackedSubscriptionId] = platformUserId.split(".");
            const selectedPlatform =
                platform === Platform.YouTube
                    ? "YouTube"
                    : platform === Platform.Twitch
                        ? "Twitch"
                        : "Unknown";

            // Check the permissions of the user
            if (
                !isDm &&
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.ManageChannels,
                )
            ) {
                await replyWithQuickEmbed(
                    interaction,
                    "You need the Manage Channels permission to use /untrack in this server.",
                    EmbedType.Error,
                );

                return;
            }

            // Remove the guild from the database
            const trackingDeleteSuccess =
                await discordRemoveGuildTrackingChannel(platformUserId);

            if (!trackingDeleteSuccess || !trackingDeleteSuccess.success) {
                await replyWithQuickEmbed(
                    interaction,
                    `Failed to stop tracking ${selectedPlatform} subscription ${trackedSubscriptionId ?? "(unknown id)"}.`,
                    EmbedType.Error,
                );

                return;
            }

            await replyWithQuickEmbed(
                interaction,
                `Stopped tracking ${selectedPlatform} subscription ${trackedSubscriptionId ?? "(unknown id)"} in this ${isDm ? "DM" : "server"}.`,
                EmbedType.Success,
            );
        },
        autoComplete: async (interaction: AutocompleteInteraction) => {
            const trackedChannels = await discordGetAllTrackedInGuild(
                interaction.guildId ?? (interaction.channelId as string),
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
                        value: `youtube.${String(channel.subscription.id)}`,
                    }))
                    .concat(
                        trackedTwitchChannels.map((channel) => ({
                            name: `Twitch: ${channel.twitchChannel.twitchChannelName} (${channel.twitchChannel.twitchChannelId}) | <#${channel.subscription.notificationChannelId}>`,
                            value: `twitch.${String(channel.subscription.id)}`,
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
            let guildId = interaction.guildId;

            const isDm = !interaction.inGuild();

            if (isDm) guildId = interaction.channelId;

            if (!guildId) {
                await replyWithQuickEmbed(
                    interaction,
                    "Unable to resolve the current server/DM context for /tracked.",
                    EmbedType.Error,
                );

                return;
            }

            const trackedChannels = await discordGetAllTrackedInGuild(guildId);

            if (!trackedChannels || !trackedChannels.success) {
                console.error(
                    "An error occurred while trying to get the tracked channels in this guild!",
                );
                await replyWithQuickEmbed(
                    interaction,
                    `Failed to load tracked subscriptions for ${isDm ? "this DM" : "this server"}.`,
                    EmbedType.Error,
                );

                return;
            }

            if (
                trackedChannels.data.youtubeSubscriptions.length === 0 &&
                trackedChannels.data.twitchSubscriptions.length === 0
            ) {
                await replyWithQuickEmbed(
                    interaction,
                    `No YouTube or Twitch subscriptions are currently tracked in ${isDm ? "this DM" : "this server"}.`,
                    EmbedType.Info,
                );

                return;
            }

            const youtubeChannels =
                trackedChannels.data.youtubeSubscriptions ?? [];
            const twitchChannels =
                trackedChannels.data.twitchSubscriptions ?? [];

            const allEntries = [
                ...youtubeChannels.map((c) => ({
                    type: "YouTube" as const,
                    name: c.youtubeChannel.youtubeChannelName,
                    id: c.youtubeChannel.youtubeChannelId,
                    notifyId: c.subscription.notificationChannelId,
                })),
                ...twitchChannels.map((c) => ({
                    type: "Twitch" as const,
                    name: c.twitchChannel.twitchChannelName,
                    id: c.twitchChannel.twitchChannelName,
                    notifyId: c.subscription.notificationChannelId,
                })),
            ].sort((a, b) => a.name.localeCompare(b.name));

            type FilterType = "all" | PlatformTypes;
            let currentPage = 0;
            let currentFilter: FilterType = "all";

            const pageSize = config.discordComponentsPageSize;

            const filterEntries = (filter: FilterType) => {
                if (filter === Platform.YouTube)
                    return allEntries.filter((e) => e.type === "YouTube");
                if (filter === Platform.Twitch)
                    return allEntries.filter((e) => e.type === "Twitch");

                return allEntries;
            };

            const getEmbed = (
                entries: typeof allEntries,
                page: number,
                filter: FilterType,
            ) => {
                const totalPages = Math.ceil(entries.length / pageSize);
                const pageEntries = entries.slice(
                    page * pageSize,
                    (page + 1) * pageSize,
                );

                const description =
                    pageEntries
                        .map((entry) => {
                            const link =
                                entry.type === "YouTube"
                                    ? `https://www.youtube.com/channel/${entry.id}`
                                    : `https://www.twitch.tv/${entry.id}`;

                            return `**[${entry.name}](${link})** • ${entry.type} • <#${entry.notifyId}>`;
                        })
                        .join("\n") || "No entries.";

                return new EmbedBuilder()
                    .setTitle("Tracked Channels")
                    .setDescription(description)
                    .setColor(0x5865f2)
                    .setFooter({
                        text: `Page ${page + 1} of ${Math.max(totalPages, 1)} — Filter: ${filter.toUpperCase()}`,
                    });
            };

            const getButtons = (
                filter: FilterType,
                page: number,
                entriesLength: number,
            ) => {
                const totalPages = Math.ceil(entriesLength / pageSize);

                const toggleRow =
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("filter_all")
                            .setLabel("🌐 All")
                            .setStyle(
                                filter === "all"
                                    ? ButtonStyle.Primary
                                    : ButtonStyle.Secondary,
                            ),
                        new ButtonBuilder()
                            .setCustomId("filter_youtube")
                            .setLabel("❤️ YouTube")
                            .setStyle(
                                filter === "youtube"
                                    ? ButtonStyle.Primary
                                    : ButtonStyle.Secondary,
                            ),
                        new ButtonBuilder()
                            .setCustomId("filter_twitch")
                            .setLabel("💜 Twitch")
                            .setStyle(
                                filter === "twitch"
                                    ? ButtonStyle.Primary
                                    : ButtonStyle.Secondary,
                            ),
                    );

                const navRow =
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("prev_page")
                            .setLabel("⬅️ Previous")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId("next_page")
                            .setLabel("Next ➡️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(
                                page >= totalPages - 1 || totalPages === 0,
                            ),
                    );

                return [toggleRow, navRow];
            };

            const entries = filterEntries(currentFilter);
            const embed = getEmbed(entries, currentPage, currentFilter);
            const buttons = getButtons(
                currentFilter,
                currentPage,
                entries.length,
            );

            await interaction.reply({
                embeds: [embed],
                components: buttons,
                flags: MessageFlags.Ephemeral,
            });

            const message = await interaction.fetchReply();

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: config.discordCollectorTimeout,
                filter: (i) => i.user.id === interaction.user.id,
            });

            collector.on("collect", async (i) => {
                let needsUpdate = false;

                switch (i.customId) {
                    case "filter_all":
                    case "filter_youtube":
                    case "filter_twitch": {
                        const newFilter = i.customId.replace(
                            "filter_",
                            "",
                        ) as FilterType;

                        if (currentFilter !== newFilter) {
                            currentFilter = newFilter;
                            currentPage = 0;
                            needsUpdate = true;
                        }
                        break;
                    }
                    case "prev_page":
                        if (currentPage > 0) {
                            currentPage--;
                            needsUpdate = true;
                        }
                        break;
                    case "next_page": {
                        const filteredEntries = filterEntries(currentFilter);
                        const totalPages = Math.ceil(
                            filteredEntries.length / pageSize,
                        );

                        if (currentPage < totalPages - 1) {
                            currentPage++;
                            needsUpdate = true;
                        }
                        break;
                    }
                }

                if (needsUpdate) {
                    const filteredEntries = filterEntries(currentFilter);

                    await i.update({
                        embeds: [
                            getEmbed(
                                filteredEntries,
                                currentPage,
                                currentFilter,
                            ),
                        ],
                        components: getButtons(
                            currentFilter,
                            currentPage,
                            filteredEntries.length,
                        ),
                    });
                } else {
                    await i.deferUpdate();
                }
            });

            collector.on("end", async () => {
                try {
                    await interaction.editReply({
                        components: [],
                    });
                } catch (err) {
                    console.error("Failed to edit reply:", err);
                }
            });
        },
    },
    updates: {
        data: {
            name: "updates",
            description: "Enable or disable updates for Feedr in this channel",
            integration_types: [0, 1],
            contexts: [0, 1],
            options: [
                {
                    name: "state",
                    description: "Choose whether to enable or disable updates",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: "Enable",
                            value: "enable",
                        },
                        {
                            name: "Disable",
                            value: "disable",
                        },
                    ],
                },
            ],
        },
        execute: async (interaction: CommandInteraction) => {
            const isDm = !interaction.inGuild();

            const channelId = interaction.channelId;
            const guildId = isDm ? channelId : interaction.guildId;

            if (!isDm && !guildId) {
                await replyWithQuickEmbed(
                    interaction,
                    "Unable to resolve the current server context for /updates.",
                    EmbedType.Error,
                );

                return;
            }

            // Check type of the channel
            const targetChannel = await client.channels.fetch(channelId);

            if (
                targetChannel &&
                (targetChannel.type === ChannelType.GuildText ||
                    targetChannel.type === ChannelType.GuildAnnouncement)
            ) {
                if (
                    !isDm &&
                    !interaction.memberPermissions?.has(
                        PermissionFlagsBits.ManageChannels,
                    )
                ) {
                    // Check the permissions of the user
                    await replyWithQuickEmbed(
                        interaction,
                        "You need the Manage Channels permission to configure /updates in this server.",
                        EmbedType.Error,
                    );

                    return;
                }
            }

            // Check the permissions of the bot in the channel
            const botMember = isDm
                ? null
                : await interaction.guild?.members.fetchMe();

            if (
                botMember &&
                !botMember
                    .permissionsIn(channelId)
                    .has(PermissionFlagsBits.SendMessages)
            ) {
                await replyWithQuickEmbed(
                    interaction,
                    `I don't have permission to send messages in <#${channelId}>.`,
                    EmbedType.Error,
                );

                return;
            }

            // Get the current state from the database
            const currentDatabaseState =
                await discordUpdateSubscriptionCheckGuild(guildId);

            if (!currentDatabaseState || !currentDatabaseState.success) {
                await replyWithQuickEmbed(
                    interaction,
                    `Failed to load the current updates state for ${isDm ? "this DM" : "this server"}.`,
                    EmbedType.Error,
                );

                return;
            }

            const currentState = Boolean(
                currentDatabaseState.data[0].feedrUpdatesChannelId,
            );
            const desiredState = Boolean(
                interaction.options.get("state")?.value === "enable",
            );

            if (currentState === desiredState) {
                await replyWithQuickEmbed(
                    interaction,
                    `Updates are already ${desiredState ? "enabled" : "disabled"
                    } for <#${channelId}>.`,
                    EmbedType.Warning,
                );

                return;
            }

            if (desiredState) {
                // Enable updates
                const updateSuccess = await discordUpdateSubscriptionAddChannel(
                    guildId,
                    channelId,
                );

                if (!updateSuccess || !updateSuccess.success) {
                    await replyWithQuickEmbed(
                        interaction,
                        `Failed to enable Feedr updates for <#${channelId}>.`,
                        EmbedType.Error,
                    );

                    return;
                }

                let confirmationSent = false;

                await client.channels
                    .fetch(channelId)
                    .then(async (channel) => {
                        if (channel?.isTextBased()) {
                            await (channel as TextChannel).send({
                                content: `Updates have been successfully enabled in this channel!`,
                            });
                            confirmationSent = true;
                        }
                    })
                    .catch(console.error);

                await replyWithQuickEmbed(
                    interaction,
                    confirmationSent
                        ? `Enabled Feedr updates for <#${channelId}> and posted a confirmation message there.`
                        : `Enabled Feedr updates for <#${channelId}>, but I couldn't post the confirmation message there.`,
                    EmbedType.Success,
                );
            } else {
                // Disable updates
                const updateSuccess =
                    await discordUpdateSubscriptionRemoveChannel(guildId);

                if (!updateSuccess || !updateSuccess.success) {
                    await replyWithQuickEmbed(
                        interaction,
                        `Failed to disable Feedr updates for <#${channelId}>.`,
                        EmbedType.Error,
                    );

                    return;
                }

                await replyWithQuickEmbed(
                    interaction,
                    `Successfully disabled updates in <#${channelId}>!`,
                    EmbedType.Success,
                );
            }
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
