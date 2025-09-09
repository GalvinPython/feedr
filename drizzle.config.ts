import { defineConfig } from "drizzle-kit";

const databaseUrl =
    process.env.NODE_ENV === "development"
        ? process.env.POSTGRES_DEV_URL
        : process.env.NODE_ENV === "staging"
          ? process.env.POSTGRES_STAGING_URL
          : process.env.POSTGRES_URL;

console.log("Using database URL:", databaseUrl);

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl!,
    },
});
