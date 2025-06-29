import Bun from "bun";

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

export default async function test(
    channelId: string,
    playlistType?: PlaylistType,
): Promise<string | null> {
    const playlistIdPrefix = !playlistType
        ? "UU"
        : playlistIdPrefixes[playlistType];

    if (!channelId.startsWith("UC")) {
        return null;
    }

    // Measure performance of method 1
    const start1 = Bun.nanoseconds();
    const playlistId = playlistIdPrefix + channelId.slice(2);
    const end1 = Bun.nanoseconds();

    // Measure performance of method 2
    const start2 = Bun.nanoseconds();
    const playlistId2 = channelId.replace("UC", playlistIdPrefix);
    const end2 = Bun.nanoseconds();

    console.log(
        `Method 1 (slice): ${end1 - start1} ns, Method 2 (replace): ${end2 - start2} ns`
    );

    return playlistId;
}

test("UC1234567890", PlaylistType.Video);

