import { ActivityType, Guild, PresenceUpdateStatus } from "discord.js";

import client from "..";

import { updateBotInfo } from "./db/botinfo";

export async function cronUpdateBotInfo() {
    if (!client?.user) return;

    const servers: number = client.guilds.cache.size;
    const members: number = client.guilds.cache.reduce(
        (acc: number, guild: Guild): number => acc + guild.memberCount,
        0,
    );

    await updateBotInfo(servers, members);
    client.user.setPresence({
        activities: [
            {
                name: `Notifying ${servers.toLocaleString()} servers [${members.toLocaleString()} members]`,
                type: ActivityType.Custom,
            },
        ],
        status: PresenceUpdateStatus.Online,
    });
}
