// This file contains TypeScript interfaces for the YouTube API responses and requests used in the bot.
// YouTube Playlist API Response Interface
export interface YouTubePlaylistResponse {
    kind: string;
    etag: string;
    nextPageToken: string;
    items: Array<{
        kind: string;
        etag: string;
        id: string;
        snippet: {
            publishedAt: string;
            channelId: string;
            title: string;
            description: string;
            thumbnails: {
                default: {
                    url: string;
                    width: number;
                    height: number;
                };
                medium: {
                    url: string;
                    width: number;
                    height: number;
                };
                high: {
                    url: string;
                    width: number;
                    height: number;
                };
                standard: {
                    url: string;
                    width: number;
                    height: number;
                };
                maxres: {
                    url: string;
                    width: number;
                    height: number;
                };
            };
            channelTitle: string;
            playlistId: string;
            position: number;
            resourceId: {
                kind: string;
                videoId: string;
            };
            videoOwnerChannelTitle: string;
            videoOwnerChannelId: string;
        };
    }>;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
}

// YouTube Video API Response Interface (Content Details)
export type YouTubeVideoContentDetailsResponse = {
    kind: string;
    etag: string;
    items: Array<{
        kind: string;
        etag: string;
        id: string;
        contentDetails: {
            duration: string;
            dimension: string;
            definition: string;
            caption: string;
            licensedContent: boolean;
            contentRating: {};
            projection: string;
        };
    }>;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
};

// YouTube Channel API Response Interface
export interface YouTubeChannelResponse {
    kind: string;
    etag: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: Array<{
        kind: string;
        etag: string;
        id: string;
        snippet: {
            title: string;
            description: string;
            customUrl: string;
            publishedAt: string;
            thumbnails: {
                default: {
                    url: string;
                    width: number;
                    height: number;
                };
                medium: {
                    url: string;
                    width: number;
                    height: number;
                };
                high: {
                    url: string;
                    width: number;
                    height: number;
                };
            };
            localized: {
                title: string;
                description: string;
            };
            country: string;
        };
    }>;
}

// YouTube Innertube Search Request Interface
export interface InnertubeSearchRequest {
    contents: {
        twoColumnSearchResultsRenderer: {
            primaryContents: {
                sectionListRenderer: {
                    contents: Array<{
                        itemSectionRenderer?: {
                            contents: Array<{
                                channelRenderer: {
                                    channelId: string;
                                    title: {
                                        simpleText: string;
                                    };
                                    navigationEndpoint: {
                                        clickTrackingParams: string;
                                        commandMetadata: {
                                            webCommandMetadata: {
                                                url: string;
                                                webPageType: string;
                                                rootVe: number;
                                                apiUrl: string;
                                            };
                                        };
                                        browseEndpoint: {
                                            browseId: string;
                                            canonicalBaseUrl: string;
                                        };
                                    };
                                    thumbnail: {
                                        thumbnails: Array<{
                                            url: string;
                                            width: number;
                                            height: number;
                                        }>;
                                    };
                                    descriptionSnippet?: {
                                        runs: Array<{
                                            text: string;
                                            bold?: boolean;
                                        }>;
                                    };
                                    shortBylineText: {
                                        runs: Array<{
                                            text: string;
                                            navigationEndpoint: {
                                                clickTrackingParams: string;
                                                commandMetadata: {
                                                    webCommandMetadata: {
                                                        url: string;
                                                        webPageType: string;
                                                        rootVe: number;
                                                        apiUrl: string;
                                                    };
                                                };
                                                browseEndpoint: {
                                                    browseId: string;
                                                    canonicalBaseUrl: string;
                                                };
                                            };
                                        }>;
                                    };
                                    videoCountText: {
                                        accessibility?: {
                                            accessibilityData: {
                                                label: string;
                                            };
                                        };
                                        simpleText?: string;
                                        runs?: Array<{
                                            text: string;
                                        }>;
                                    };
                                    subscriptionButton: {
                                        subscribed: boolean;
                                    };
                                    ownerBadges?: Array<{
                                        metadataBadgeRenderer: {
                                            icon: {
                                                iconType: string;
                                            };
                                            style: string;
                                            tooltip: string;
                                            trackingParams: string;
                                            accessibilityData: {
                                                label: string;
                                            };
                                        };
                                    }>;
                                    subscriberCountText: {
                                        simpleText: string;
                                        accessibility?: {
                                            accessibilityData: {
                                                label: string;
                                            };
                                        };
                                    };
                                    subscribeButton: {
                                        buttonRenderer: {
                                            style: string;
                                            size: string;
                                            isDisabled: boolean;
                                            text: {
                                                runs: Array<{
                                                    text: string;
                                                }>;
                                            };
                                            navigationEndpoint: {
                                                clickTrackingParams: string;
                                                commandMetadata: {
                                                    webCommandMetadata: {
                                                        url: string;
                                                        webPageType: string;
                                                        rootVe: number;
                                                    };
                                                };
                                                signInEndpoint: {
                                                    nextEndpoint: {
                                                        clickTrackingParams: string;
                                                        commandMetadata: {
                                                            webCommandMetadata: {
                                                                url: string;
                                                                webPageType: string;
                                                                rootVe: number;
                                                            };
                                                        };
                                                        searchEndpoint: {
                                                            query: string;
                                                            params: string;
                                                        };
                                                    };
                                                    continueAction: string;
                                                };
                                            };
                                            trackingParams: string;
                                        };
                                    };
                                    trackingParams: string;
                                    longBylineText: {
                                        runs: Array<{
                                            text: string;
                                            navigationEndpoint: {
                                                clickTrackingParams: string;
                                                commandMetadata: {
                                                    webCommandMetadata: {
                                                        url: string;
                                                        webPageType: string;
                                                        rootVe: number;
                                                        apiUrl: string;
                                                    };
                                                };
                                                browseEndpoint: {
                                                    browseId: string;
                                                    canonicalBaseUrl: string;
                                                };
                                            };
                                        }>;
                                    };
                                };
                            }>;
                        };
                    }>;
                };
            };
        };
    };
}
