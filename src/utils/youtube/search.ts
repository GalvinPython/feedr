import type { InnertubeSearchRequest } from "../../types/youtube";

import formatLargeNumber from "../formatLargeNumber";

export default async function (query: string) {
    try {
        const response = await fetch(
            "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
            {
                headers: {
                    "X-Goog-Fieldmask":
                        "contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.itemSectionRenderer.contents",
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            clientName: "WEB",
                            clientVersion: "2.20241212.08.00",
                        },
                    },
                    params: "EgIQAg%3D%3D",
                    query: query,
                }),
                method: "POST",
            },
        );

        const data = (
            await ((await response.json()) as Promise<InnertubeSearchRequest>)
        ).contents.twoColumnSearchResultsRenderer.primaryContents
            .sectionListRenderer.contents;

        console.dir(data, { depth: null });

        if (!data || data.length === 0) {
            console.error("No search results found for query:", query);

            return [];
        }

        const channelsResponse: Array<{
            title: string;
            handle: string;
            subscribers: number | string;
            channel_id: string;
        }> = [];

        for (const content of data ?? []) {
            for (const channel of content?.itemSectionRenderer?.contents ??
                []) {
                if (channel?.channelRenderer?.channelId) {
                    channelsResponse.push({
                        title:
                            channel?.channelRenderer?.longBylineText?.runs?.[0]
                                ?.text || "N/A",
                        handle:
                            channel?.channelRenderer?.subscriberCountText
                                ?.simpleText || "N/A",
                        subscribers: formatLargeNumber(
                            channel?.channelRenderer?.videoCountText
                                ?.simpleText,
                        ),
                        channel_id:
                            channel?.channelRenderer?.channelId || "N/A",
                    });
                }
            }
        }

        return channelsResponse;
    } catch (err) {
        console.error(err);

        return [];
    }
}
