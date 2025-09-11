import { Client } from "pg";

import { config } from "../config";

// Connect to Postgres
const client = new Client({ connectionString: config.databaseUrl });

await client.connect();

console.log(`Truncating all tables in database: ${config.databaseUrl}`);

try {
    // 1. Get all table names in the public schema
    const { rows: tables } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);

    if (tables.length === 0) {
        console.log("No tables found to truncate");
    } else {
        // 2. Build comma-separated list of tables
        const tableNames = tables.map((t) => `"${t.table_name}"`).join(", ");

        // 3. Truncate all tables
        await client.query(
            `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
        );
        console.log(`Truncated ${tables.length} tables: ${tableNames}`);
    }
} catch (err) {
    console.error("❌ Error truncating tables:", err);
} finally {
    await client.end();
    process.exit(0);
}
