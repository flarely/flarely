import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "../config.js";
import * as schema from "./schema.js";

function createDb() {
  // Ensure the data directory exists before opening the file
  mkdirSync(dirname(config.DATABASE_PATH), { recursive: true });

  const sqlite = new Database(config.DATABASE_PATH);

  // Performance pragmas — safe for our single-writer use case
  sqlite.pragma("journal_mode = WAL");  // concurrent reads while writing
  sqlite.pragma("synchronous = NORMAL"); // safe with WAL, much faster than FULL
  sqlite.pragma("foreign_keys = ON");    // enforce FK constraints

  return drizzle(sqlite, { schema });
}

// Singleton — one connection shared across the process
export const db = createDb();
export type Db = typeof db;
