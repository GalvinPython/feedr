-- Apply before deploying audit logging so departed guild history is retained.
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_guild_id_discord_guild_id_fk";
