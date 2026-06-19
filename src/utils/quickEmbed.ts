import {
    EmbedBuilder,
    MessageFlags,
    type InteractionReplyOptions,
} from "discord.js";

export enum EmbedType {
    Success = "success",
    Error = "error",
    Warning = "warning",
    Info = "info",
}

const EMBED_COLORS: Record<EmbedType, number> = {
    [EmbedType.Success]: 0x57f287,
    [EmbedType.Error]: 0xed4245,
    [EmbedType.Warning]: 0xfee75c,
    [EmbedType.Info]: 0x5865f2,
};

const EMBED_TITLES: Record<EmbedType, string> = {
    [EmbedType.Success]: "Success",
    [EmbedType.Error]: "Error",
    [EmbedType.Warning]: "Warning",
    [EmbedType.Info]: "Info",
};

type QuickEmbedReplyOptions = Omit<
    InteractionReplyOptions,
    "content" | "embeds"
> & {
    title?: string;
};

type Replyable = {
    reply: (options: InteractionReplyOptions) => Promise<unknown>;
};

export function buildQuickEmbed(
    query: string,
    type: EmbedType = EmbedType.Info,
    title?: string,
) {
    return new EmbedBuilder()
        .setColor(EMBED_COLORS[type])
        .setTitle(title ?? EMBED_TITLES[type])
        .setDescription(query);
}

export async function replyWithQuickEmbed(
    interaction: Replyable,
    query: string,
    type: EmbedType = EmbedType.Info,
    options: QuickEmbedReplyOptions = {},
) {
    const { title, flags, ...restOptions } = options;

    return interaction.reply({
        flags: flags ?? MessageFlags.Ephemeral,
        embeds: [buildQuickEmbed(query, type, title)],
        ...restOptions,
    });
}

export default buildQuickEmbed;
