/**
 * Run this once on first deploy and after any schema change:
 *   npm run db:migrate
 *
 * It applies all pending SQL migrations from src/db/migrations/
 * and is safe to run multiple times (idempotent).
 */

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "url";
import { db } from "./index.js";

/**
 * Exported for use by flarely-cloud — runs core migrations against the
 * shared db instance so the caller doesn't need to know the migrations path.
 */
export function runCoreMigrations(): void {
  migrate(db, {
    migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url)),
  });
}

// When invoked directly via `npm run db:migrate`, run immediately.
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(
    process.argv[1].replace(/\\/g, "/").split("/").pop() ?? ""
  );

if (isMain) {
  console.log("🗄️  Running database migrations...");
  runCoreMigrations();
  console.log("✅ Migrations complete.");
}
