import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import { db, projects, apiKeys } from "../../db/index.js";
import { ask, choose } from "../utils/index.js";

export async function createProject(): Promise<void> {
  console.log();
  const name = await ask("Project name: ");
  if (!name) { console.log("  Aborted.\n"); return; }

  const destination = await choose("\nDestination type:", [
    "slack",
    "discord",
    "email",
  ] as const);

  let destConfig: Record<string, string> = {};

  if (destination === "slack" || destination === "discord") {
    destConfig.webhookUrl = await ask("Webhook URL: ");
  } else {
    destConfig.to   = await ask("Send alerts TO (email address): ");
    destConfig.from = await ask("Send alerts FROM (e.g. Flarely <alerts@yourdomain.com>): ");
  }

  const windowRaw  = await ask("Dedup window in seconds (Enter for default 600): ");
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

  // Generate first API key automatically
  const rawKey  = `sk_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  db.insert(apiKeys)
    .values({ id: nanoid(), projectId, keyHash, label: "default" })
    .run();

  console.log(`\n  ✅ Project "${name}" created!\n`);
  console.log(`  Destination : ${destination}`);
  console.log(`  Dedup window: ${dedupWindow}s`);
  console.log(`  Project ID  : ${projectId}`);
  console.log(`\n  API Key (shown once — save it now):\n`);
  console.log(`  ${rawKey}\n`);
}
