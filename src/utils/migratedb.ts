import path from "path";

import { Database } from "bun:sqlite";

const db = new Database(path.resolve(process.cwd(), "db.sqlite3"));
