// NOTE: Experimental
// You think i was typing this all out manually? lol no :p

export type InnertubeSearchRequest = {
    contents: {
        twoColumnSearchResultsRenderer: {
            primaryContents: {
                sectionListRenderer: {
                    contents: Array<{
                        itemSectionRenderer?: {
                            contents: Array<{
                                didYouMeanRenderer?: {
                                    didYouMean: {
                                        runs: Array<{
                                            text: string;
                                        }>;
                                    };
                                    correctedQuery: {
                                        runs: Array<{
                                            text: string;
                                            italics: boolean;
                                        }>;
                                    };
                                    correctedQueryEndpoint: {
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
                                    trackingParams: string;
                                };
                                channelRenderer?: {
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
                                        accessibility: {
                                            accessibilityData: {
                                                label: string;
                                            };
                                        };
                                        simpleText: string;
                                    };
                                    subscriptionButton: {
                                        subscribed: boolean;
                                    };
                                    subscriberCountText: {
                                        simpleText: string;
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
};
