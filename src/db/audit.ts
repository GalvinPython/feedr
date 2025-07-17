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
    try {
        await db.insert(dbAuditLogsTable).values({
            guildId,
            eventType,
            successType,
            data,
            occurredAt: new Date(),
        });
    } catch (error) {
        console.error("Error creating audit log entry:", error);
    }
}
