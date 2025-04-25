// NOTE: Experimental
import type { InnertubeSearchRequest } from "../../types/innertube";

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
    } catch (err) {
        console.error(err);
    }
}
