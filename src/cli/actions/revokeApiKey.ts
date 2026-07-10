import { eq } from "drizzle-orm";
import { db, projects, apiKeys } from "../../db/index.js";
import { choose, confirm } from "../utils/index.js";
import { lang } from "../lang/index.js";
import { logger } from "../../logger.js";

export async function revokeApiKey(): Promise<void> {
  let all;
  try {
    all = db.select().from(projects).all();
  } catch (err) {
    logger.error("Failed to load projects", err);
    console.log(lang.dbError);
    return;
  }

  if (all.length === 0) {
    console.log(lang.noProjectsShort);
    return;
  }

  console.log();
  const projectNames = all.map((p) => p.name);
  const chosen  = await choose(lang.prompt.selectProject, projectNames);
  const project = all[projectNames.indexOf(chosen)];

  let keys;
  try {
    keys = db.select().from(apiKeys).where(eq(apiKeys.projectId, project.id)).all();
  } catch (err) {
    logger.error("Failed to load API keys", err);
    console.log(lang.dbError);
    return;
  }

  if (keys.length === 0) {
    console.log(lang.info.noKeysForProject(project.name));
    return;
  }

  const keyLabels   = keys.map(
    (k) => `${(k.label ?? "unlabelled").padEnd(16)}  id: ...${k.id.slice(-8)}`
  );
  const chosenLabel = await choose(lang.prompt.selectKeyToRevoke, keyLabels);
  const keyToRevoke = keys[keyLabels.indexOf(chosenLabel)];

  const ok = await confirm(lang.confirm.revokeKey(keyToRevoke.label ?? keyToRevoke.id));
  if (!ok) { console.log(lang.aborted); return; }

  try {
    db.delete(apiKeys).where(eq(apiKeys.id, keyToRevoke.id)).run();
  } catch (err) {
    logger.error("Failed to revoke API key", err);
    console.log(lang.dbError);
    return;
  }

  console.log(lang.success.apiKeyRevoked);
}
