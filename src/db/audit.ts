import { config } from "../config";

import {
    dbAuditLogsEventTypeEnum,
    dbAuditLogsSuccessTypeEnum,
    dbAuditLogsTable,
} from "./schema";
import { db } from "./db";

export async function dbAuditLogCreate(
    guildId: string,
    eventType: (typeof dbAuditLogsEventTypeEnum)["enumValues"][number],
    successType: (typeof dbAuditLogsSuccessTypeEnum)["enumValues"][number],
    data: Record<string, unknown> | null = null,
): Promise<void> {
    const occurredAt = new Date();

    try {
        await db.insert(dbAuditLogsTable).values({
            guildId,
            eventType,
            successType,
            data,
            occurredAt,
        });
    } catch (error) {
        console.error("Error creating audit log entry:", error);
    }

    if (!config.discordLogsWebhookUrl) return;
    try {
        const colors = {
            success: 0x57f287,
            failure: 0xed4245,
            info: 0x5865f2,
            warning: 0xfee75c,
        };
        const details = JSON.stringify(data, null, 2) ?? "null";
        const response = await fetch(config.discordLogsWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [
                    {
                        title: eventType,
                        color: colors[successType],
                        fields: [
                            {
                                name: "Result",
                                value: successType,
                                inline: true,
                            },
                            {
                                name: "Guild / DM ID",
                                value: guildId,
                                inline: true,
                            },
                            {
                                name: "Details",
                                value: `\`\`\`json\n${details.slice(0, 980)}\n\`\`\``,
                            },
                        ],
                        timestamp: occurredAt.toISOString(),
                    },
                ],
            }),
        });

        if (!response.ok)
            console.error("Audit webhook failed:", response.status);
    } catch (error) {
        console.error("Error sending audit webhook:", error);
    }
}
