/**
 * First-time setup CLI.
 * Run with: pnpm setup
 *
 * Creates the first project + API key and prints the raw key once.
 * For managing projects after setup, use: pnpm manage
 */

import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "url";
import { db, projects, apiKeys } from "../db/index.js";
import { ask, choose, closePrompt } from "./utils/index.js";

async function main() {
  // Ensure schema is up to date before inserting anything
  const migrationsPath = fileURLToPath(
    new URL("../db/migrations", import.meta.url)
  );
  migrate(db, { migrationsFolder: migrationsPath });

  console.log("\n🔥  Flarely — First-time Setup\n");
  console.log("  (To manage projects later, run: pnpm manage)\n");

  const name = await ask("Project name: ");
  if (!name) { console.log("  Aborted.\n"); closePrompt(); return; }

  const destination = await choose("\nDestination type:", [
    "slack",
    "discord",
    "email",
    "telegram",
    "webhook",
  ] as const);

  let destConfig: Record<string, string> = {};

  if (destination === "slack" || destination === "discord") {
    destConfig.webhookUrl = await ask("Webhook URL: ");
  } else if (destination === "email") {
    destConfig.to   = await ask("Send alerts TO (email address): ");
    destConfig.from = await ask("Send alerts FROM (e.g. Flarely <alerts@yourdomain.com>): ");
  } else if (destination === "telegram") {
    destConfig.botToken = await ask("Bot token: ");
    destConfig.chatId   = await ask("Chat ID: ");
  } else if (destination === "webhook") {
    destConfig.url = await ask("Webhook URL: ");
  }

  const windowRaw   = await ask("\nDedup window in seconds (Enter for default 600): ");
  const dedupWindow = parseInt(windowRaw) || 600;

  const projectId = nanoid();
  db.insert(projects)
    .values({
      id: projectId,
      name,
      destination,
      config: JSON.stringify(destConfig),
      dedupWindow,
    })
    .run();

  const rawKey  = `sk_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  db.insert(apiKeys)
    .values({ id: nanoid(), projectId, keyHash, label: "default" })
    .run();

  closePrompt();

  console.log("\n✅  Project created!\n");
  console.log(`   Name        : ${name}`);
  console.log(`   Destination : ${destination}`);
  console.log(`   Dedup window: ${dedupWindow}s`);
  console.log(`   Project ID  : ${projectId}`);
  console.log(`\n   API Key (shown once — save it now):\n`);
  console.log(`   ${rawKey}\n`);
  console.log(
    `Try it:\n\n   curl -X POST http://localhost:3000/v1/ingest \\\n     -H "Authorization: Bearer ${rawKey}" \\\n     -H "Content-Type: application/json" \\\n     -d '{"title":"Test","level":"error","source":"setup-cli"}'\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
