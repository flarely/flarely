import { nanoid } from "nanoid";
import { db, projects, apiKeys } from "../../db/index.js";
import { ask, choose, generateApiKey, collectDestinationConfig } from "../utils/index.js";
import { lang } from "../lang/index.js";
import { logger } from "../../logger.js";
import { DESTINATION_TYPES, DEFAULT_DEDUP_WINDOW_SECONDS, DEFAULT_API_KEY_LABEL } from "../../constants.js";

export async function createProject(): Promise<void> {
  console.log();
  const name = await ask(lang.prompt.projectName);
  if (!name) { console.log(lang.aborted); return; }

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
    return;
  }

  console.log(lang.success.projectCreated(name));
  console.log(lang.info.projectDetails(destination, dedupWindow, projectId));
  console.log(lang.info.apiKeyOnce);
  console.log(`  ${rawKey}\n`);
}
