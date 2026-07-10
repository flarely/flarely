/**
 * First-time setup CLI.
 * Run with: pnpm setup
 *
 * Creates the first project + API key and prints the raw key once.
 * For managing projects after setup, use: pnpm manage
 */

import { nanoid } from "nanoid";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "url";
import { db, projects, apiKeys } from "../db/index.js";
import { ask, choose, generateApiKey, collectDestinationConfig, closePrompt } from "./utils/index.js";
import { lang } from "./lang/index.js";
import { logger } from "../logger.js";
import { DESTINATION_TYPES, DEFAULT_DEDUP_WINDOW_SECONDS, DEFAULT_API_KEY_LABEL } from "../constants.js";

async function main() {
  const migrationsPath = fileURLToPath(new URL("../db/migrations", import.meta.url));
  migrate(db, { migrationsFolder: migrationsPath });

  console.log(lang.setup.banner);
  console.log(lang.setup.hint);

  const name = await ask(lang.prompt.projectName);
  if (!name) { console.log(lang.aborted); closePrompt(); return; }

  const destination = await choose(lang.prompt.destinationType, [...DESTINATION_TYPES]);
  const destConfig  = await collectDestinationConfig(destination);

  const windowRaw  = await ask(lang.prompt.dedupWindow);
  const dedupWindow = parseInt(windowRaw) || DEFAULT_DEDUP_WINDOW_SECONDS;

  const projectId = nanoid();
  try {
    db.insert(projects)
      .values({ id: projectId, name, destination, config: JSON.stringify(destConfig), dedupWindow })
      .run();
  } catch (err) {
    logger.error("Failed to create project", err);
    console.log(lang.dbError);
    closePrompt();
    return;
  }

  const { rawKey, keyHash } = generateApiKey();
  try {
    db.insert(apiKeys)
      .values({ id: nanoid(), projectId, keyHash, label: DEFAULT_API_KEY_LABEL })
      .run();
  } catch (err) {
    logger.error("Failed to create initial API key", err);
    console.log(lang.dbError);
    closePrompt();
    return;
  }

  closePrompt();

  console.log(lang.success.projectCreated(name));
  console.log(lang.info.projectDetails(destination, dedupWindow, projectId));
  console.log(lang.info.apiKeyOnce);
  console.log(`   ${rawKey}\n`);
  console.log(
    `Try it:\n\n   curl -X POST http://localhost:3000/v1/ingest \\\n     -H "Authorization: Bearer ${rawKey}" \\\n     -H "Content-Type: application/json" \\\n     -d '{"title":"Test","level":"info","source":"setup-cli"}'\n`
  );
}

main().catch((err) => {
  logger.error("Fatal startup error", err);
  process.exit(1);
});
