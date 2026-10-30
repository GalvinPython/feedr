import { env } from "../../config";

import { twitchToken, twitchFetch } from "./auth";

export async function getStreamerName(
    streamerId: string,
): Promise<string | null> {
    if (!twitchToken || !env.twitchClientId) {
        console.error("Twitch token not found in getStreamerName");

        return null;
    }

    const res = await twitchFetch(
        `https://api.twitch.tv/helix/users?id=${streamerId}`,
    );

    if (!res.ok) {
        console.error(
            "Error fetching stream data in getStreamerName:",
            res.statusText,
        );

        return null;
    }

    const data = await res.json();

    console.log("Streamer data:", data);
    if (data.data && data.data.length > 0) {
        return data.data[0].display_name;
    } else {
        return null;
    }
}
