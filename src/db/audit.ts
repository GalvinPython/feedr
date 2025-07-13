export enum AuditResolution {
    AUDIT_RESOLUTION_FAIL = "fail",
    AUDIT_RESOLUTION_SUCCESS = "success",
    AUDIT_RESOLUTION_ERROR = "error",
    AUDIT_RESOLUTION_NULL = "null",
}

export enum AuditType {
    GUILD_CHECKED_YOUTUBE_CHANNEL = "guild_checked_youtube_channel",
}

export async function addAuditEntry(
    type: AuditType,
    resolution: AuditResolution,
) {
    console.log("Adding audit entry:", type, resolution);
    throw new Error("Not implemented");
}
