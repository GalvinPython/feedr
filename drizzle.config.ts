import { defineConfig } from "drizzle-kit";

import { config } from "./src/config";

console.log("Using database URL:", config.databaseUrl);

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: config.databaseUrl!,
    },
});
