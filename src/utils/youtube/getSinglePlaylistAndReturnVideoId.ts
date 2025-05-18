import type { YouTubePlaylistResponse } from "../../types/youtube";

import { env } from "../../config";

export enum PlaylistType {
    Video = "video",
    Short = "short",
    Stream = "stream",
}

const playlistIdPrefixes: Record<PlaylistType, string> = {
    [PlaylistType.Video]: "UULF",
    [PlaylistType.Short]: "UUSH",
    [PlaylistType.Stream]: "UULV",
};

export default async function (
    channelId: string,
    playlistType?: PlaylistType,
): Promise<string | null> {
    const playlistIdPrefix = !playlistType
        ? "UU"
        : playlistIdPrefixes[playlistType];

    if (!channelId.startsWith("UC")) {
        return null;
    }

    const playlistId = playlistIdPrefix + channelId.slice(2);

    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${env.youtubeApiKey}`,
    );

    if (!res.ok) {
        return null;
    }

    const json = (await res.json()) as YouTubePlaylistResponse;

    if (!json.items || json.items.length === 0) {
        return null;
    }

    // Yes this does actually return the video ID, you'll be surprised how weird YouTube's API is
    return atob(json.items[0].id).split(".")[1];
}
