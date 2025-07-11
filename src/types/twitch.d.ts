export interface TwitchChannelSearchResponse {
    data: Array<{
        broadcaster_language: string;
        broadcaster_login: string;
        display_name: string;
        game_id: string;
        game_name: string;
        id: string;
        is_live: string;
        tag_ids: Array<any>;
        tags: Array<string>;
        thumbnail_url: string;
        title: string;
        started_at: string;
    }>;
    pagination: {
        cursor: string;
    };
}

export interface TwitchChannelSearchAutocompleteResponse {
    id: string;
    displayName: string;
    loginName: string;
    gameId: string;
    gameName: string;
    isLive: boolean;
    thumbnailUrl: string;
    title?: string;
    startedAt?: string;
}
