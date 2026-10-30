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
}
