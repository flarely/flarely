import { eq } from "drizzle-orm";
import { db, projects, apiKeys } from "../../db/index.js";
import { lang } from "../lang/index.js";
import { logger } from "../../logger.js";

export async function listProjects(): Promise<void> {
  let all;
  try {
    all = db.select().from(projects).orderBy(projects.createdAt).all();
  } catch (err) {
    logger.error("Failed to load projects", err);
    console.log(lang.dbError);
    return;
  }

  if (all.length === 0) {
    console.log(lang.info.listEmpty);
    return;
  }

  console.log(`\n${lang.info.listHeader}`);
  console.log(lang.info.listSeparator);

  for (const project of all) {
    let keyCount = 0;
    try {
      keyCount = db.select().from(apiKeys).where(eq(apiKeys.projectId, project.id)).all().length;
    } catch (err) {
      logger.error(`Failed to count keys for project ${project.id}`, err);
    }
    console.log(lang.info.listRow(project.name, project.destination, project.dedupWindow, keyCount));
  }

  console.log();
}
