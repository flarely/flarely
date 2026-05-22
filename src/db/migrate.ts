/**
 * Run this once on first deploy and after any schema change:
 *   pnpm db:migrate
 *
 * It applies all pending SQL migrations from src/db/migrations/
 * and is safe to run multiple times (idempotent).
 */

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index.js";

console.log("🗄️  Running database migrations...");

migrate(db, {
  migrationsFolder: new URL("./migrations", import.meta.url).pathname,
});

console.log("✅ Migrations complete.");
