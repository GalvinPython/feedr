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

export async function getAllUploadIds(channelId: string): Promise<string[]> {
    if (!channelId.startsWith("UC"))
        throw new Error("Invalid YouTube channel ID");
    const ids: string[] = [];
    let pageToken: string | undefined;

    do {
        const params = new URLSearchParams({
            part: "snippet",
            playlistId: "UU" + channelId.slice(2),
            maxResults: "50",
            key: env.youtubeApiKey ?? "",
        });

        if (pageToken) params.set("pageToken", pageToken);
        const res = await fetch(
            `https://youtube.googleapis.com/youtube/v3/playlistItems?${params}`,
        );

        if (res.status === 404) return ids;
        if (!res.ok)
            throw new Error(`YouTube uploads request failed: ${res.status}`);
        const data = (await res.json()) as {
            nextPageToken?: string;
            items?: { snippet?: { resourceId?: { videoId?: string } } }[];
        };

        for (const item of data.items ?? []) {
            const id = item.snippet?.resourceId?.videoId;

            if (id) ids.push(id);
        }
        pageToken = data.nextPageToken;
    } while (pageToken);

    return ids;
}

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

    if (!res.ok) {
        console.error(
            `Failed to fetch playlist items for channel ${channelId} (${playlistId}): ${res.status}`,
        );

        if (res.status === 404) return { videoId: null, datePublished: null };
        throw new Error(`YouTube playlist request failed: ${res.status}`);
    }

    const json = (await res.json()) as YouTubePlaylistResponse;

    if (!json.items || json.items.length === 0) {
        return { videoId: null, datePublished: null };
    }

    // Yes this does actually return the video ID, you'll be surprised how weird YouTube's API is
    return {
        videoId: atob(json.items[0].id).split(".")[1],
        datePublished: new Date(json.items[0].snippet.publishedAt),
    };
}
