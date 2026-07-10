import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db, projects, apiKeys } from "../../db/index.js";
import { ask, choose, generateApiKey } from "../utils/index.js";
import { lang } from "../lang/index.js";
import { logger } from "../../logger.js";

export async function addApiKey(): Promise<void> {
  let all;
  try {
    all = db.select().from(projects).all();
  } catch (err) {
    logger.error("Failed to load projects", err);
    console.log(lang.dbError);
    return;
  }

  if (all.length === 0) {
    console.log(lang.noProjects);
    return;
  }

  console.log();
  const projectNames = all.map((p) => p.name);
  const chosen  = await choose(lang.prompt.selectProject, projectNames);
  const project = all[projectNames.indexOf(chosen)];

  const label = await ask(lang.prompt.keyLabel);
  const { rawKey, keyHash } = generateApiKey();

  try {
    db.insert(apiKeys)
      .values({ id: nanoid(), projectId: project.id, keyHash, label: label || null })
      .run();
  } catch (err) {
    logger.error("Failed to insert API key", err);
    console.log(lang.dbError);
    return;
  }

  let keyCount = 1;
  try {
    keyCount = db.select().from(apiKeys).where(eq(apiKeys.projectId, project.id)).all().length;
  } catch (err) {
    logger.error("Failed to count keys", err);
  }

  console.log(lang.success.apiKeyAdded(project.name, keyCount));
  console.log(lang.info.apiKeyOnce);
  console.log(`  ${rawKey}\n`);
}
