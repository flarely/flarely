/**
 * First-time setup CLI.
 * Run with: pnpm setup
 *
 * Creates a project + API key and prints the raw key once.
 * The raw key is never stored — only its sha256 hash is saved.
 */

import { createInterface } from "readline";
import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "url";
import { db } from "../db/index.js";
import { projects, apiKeys } from "../db/schema.js";

// ── Helpers ────────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((resolve) =>
    rl.question(question, (a) => resolve(a.trim()))
  );
}

async function choose<T extends string>(
  question: string,
  options: T[]
): Promise<T> {
  const listed = options.map((o, i) => `  ${i + 1}. ${o}`).join("\n");
  while (true) {
    const raw = await ask(`${question}\n${listed}\n> `);
    const idx = parseInt(raw) - 1;
    if (idx >= 0 && idx < options.length) return options[idx];
    console.log("  Invalid choice, try again.\n");
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Ensure schema is up to date before inserting anything
  const migrationsPath = fileURLToPath(
    new URL("../db/migrations", import.meta.url)
  );
  migrate(db, { migrationsFolder: migrationsPath });

  console.log("\n🔥  Flarely — First-time Setup\n");

  const name = await ask("Project name: ");

  const destination = await choose(
    "\nDestination type:",
    ["slack", "discord", "email"] as const
  );

  let destConfig: Record<string, string> = {};

  if (destination === "slack" || destination === "discord") {
    destConfig.webhookUrl = await ask("Webhook URL: ");
  } else {
    destConfig.to = await ask("Send alerts TO (email address): ");
    destConfig.from = await ask(
      "Send alerts FROM (e.g. Flarely <alerts@yourdomain.com>): "
    );
  }

  const windowRaw = await ask(
    "\nDedup window in seconds (press Enter for default 600): "
  );
  const dedupWindow = parseInt(windowRaw) || 600;

  // ── Persist project ──────────────────────────────────────────────────────
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

  // ── Generate & store API key ─────────────────────────────────────────────
  const rawKey = `sk_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  db.insert(apiKeys)
    .values({
      id: nanoid(),
      projectId,
      keyHash,
      label: "default",
    })
    .run();

  rl.close();

  // ── Print summary ────────────────────────────────────────────────────────
  console.log("\n✅  Project created!\n");
  console.log(`   Name        : ${name}`);
  console.log(`   Destination : ${destination}`);
  console.log(`   Dedup window: ${dedupWindow}s`);
  console.log(`   Project ID  : ${projectId}`);
  console.log(`\n   API Key (shown once — save it now):\n`);
  console.log(`   ${rawKey}\n`);
  console.log(
    `Try it:\n\n   curl -X POST http://localhost:3000/v1/ingest \\\n     -H "Authorization: Bearer ${rawKey}" \\\n     -H "Content-Type: application/json" \\\n     -d '{"title":"Test alert","level":"error","source":"setup-cli"}'\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
