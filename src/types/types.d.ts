// Generalised types to be used throughout the bot if its not suitable in the other files

export enum Platform {
    YouTube = "youtube",
    Twitch = "twitch",
}

export type PlatformTypes = (typeof Platform)[keyof typeof Platform];

export enum YouTubeContentType {
    Videos = 1 << 0,
    Shorts = 1 << 1,
    Streams = 1 << 2,
}

// Helper for readability
export const YouTubeContentTypeLabels = {
    [YouTubeContentType.Videos]: "Videos",
    [YouTubeContentType.Shorts]: "Shorts",
    [YouTubeContentType.Streams]: "Livestreams",
};
