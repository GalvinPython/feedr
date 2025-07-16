// This function is used when a new channel is being added to the database
// It will also be used to get the content type of a new upload

import type { YouTubePlaylistResponse } from "../../types/youtube";

import { env } from "../../config";

export enum PlaylistType {
    All = "all",
    Video = "video",
    Short = "short",
    Stream = "stream",
}

const playlistIdPrefixes: Record<PlaylistType, string> = {
    [PlaylistType.All]: "UU",
    [PlaylistType.Video]: "UULF",
    [PlaylistType.Short]: "UUSH",
    [PlaylistType.Stream]: "UULV",
};

export default async function (
    channelId: string,
    playlistType?: PlaylistType,
): Promise<
    | { videoId: string; datePublished: Date }
    | { videoId: null; datePublished: null }
> {
    const playlistIdPrefix = !playlistType
        ? "UU"
        : playlistIdPrefixes[playlistType];

    if (!channelId.startsWith("UC")) {
        return { videoId: null, datePublished: null };
    }

    const playlistId = playlistIdPrefix + channelId.slice(2);

    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${env.youtubeApiKey}`,
    );
    const json = (await res.json()) as YouTubePlaylistResponse;

    if (!res.ok) {
        console.error(
            `Failed to fetch playlist items for channel ${channelId} (${playlistId}): ${res.status}`,
        );

        return { videoId: null, datePublished: null };
    }

    if (!json.items || json.items.length === 0) {
        return { videoId: null, datePublished: null };
    }

    // Yes this does actually return the video ID, you'll be surprised how weird YouTube's API is
    return {
        videoId: atob(json.items[0].id).split(".")[1],
        datePublished: new Date(json.items[0].snippet.publishedAt),
    };
}
