import type {
    TwitchChannelSearchAutocompleteResponse,
    TwitchChannelSearchResponse,
} from "../../types/twitch";

import { env } from "../../config";

import { twitchToken } from "./auth";

export default async function search(
    searchQuery: string,
): Promise<TwitchChannelSearchAutocompleteResponse[] | null> {
    if (!twitchToken || !env.twitchClientId) {
        console.error("Twitch token not found in checkIfStreamerIsLive");

        return null;
    }

    const res = await fetch(
        `https://api.twitch.tv/helix/search/channels?query=${searchQuery}`,
        {
            headers: {
                Authorization: `Bearer ${twitchToken}`,
                "Client-Id": env.twitchClientId,
            },
        },
    );

    console.log(
        "Remaining quota:",
        res.headers.get("Ratelimit-Remaining"),
        "of:",
        res.headers.get("Ratelimit-Limit"),
        "Reset at:",
        res.headers.get("Ratelimit-Reset"),
    );

    if (!res.ok) {
        console.error(
            "Error fetching search results from Twitch API:",
            res.statusText,
        );

        return null;
    }

    const data = (await res.json()) as TwitchChannelSearchResponse;

    console.log("Search response:", data);

    return data.data.map((channel) => ({
        id: channel.id,
        displayName: channel.display_name,
        loginName: channel.broadcaster_login,
        gameId: channel.game_id,
        gameName: channel.game_name,
        isLive: channel.is_live === "true",
        thumbnailUrl: channel.thumbnail_url,
        title: channel.title,
        startedAt: channel.started_at,
    })) as TwitchChannelSearchAutocompleteResponse[];
}
