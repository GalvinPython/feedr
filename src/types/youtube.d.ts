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
