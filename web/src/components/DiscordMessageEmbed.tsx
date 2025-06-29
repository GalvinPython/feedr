// I was testing something to use at a later date :p

import {
    DiscordMessages,
    DiscordMessage,
    DiscordEmbed,
    DiscordEmbedFields,
    DiscordButton,
    DiscordAttachments,
    DiscordActionRow,
} from "@skyra/discord-components-react";

export const DiscordMessageEmbed = () => (
    <section>
        <DiscordMessages noBackground>
            <DiscordMessage profile="favna">
                <b>MrBeast</b> uploaded a new video!
                <DiscordEmbed
                    slot="embeds"
                    color="#ff0000"
                    embed-title="Would You Risk Drowning for $500,000?"
                >
                    <DiscordEmbedFields slot="fields">
                        <img
                            src="https://i.ytimg.com/vi/uyiG6uw-6pA/maxresdefault.jpg"
                            width="720"
                            alt="lit-logo"
                        />
                    </DiscordEmbedFields>
                </DiscordEmbed>
                <DiscordAttachments slot="components">
                    <DiscordActionRow>
                        <DiscordButton url="https://www.youtube.com/watch?v=uyiG6uw-6pA">
                            👀 Watch
                        </DiscordButton>
                    </DiscordActionRow>
                </DiscordAttachments>
            </DiscordMessage>
        </DiscordMessages>
    </section>
);
