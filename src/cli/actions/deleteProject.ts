import { eq } from "drizzle-orm";
import { db, projects } from "../../db/index.js";
import { choose, confirm } from "../utils/index.js";
import { lang } from "../lang/index.js";
import { logger } from "../../logger.js";

export async function deleteProject(): Promise<void> {
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
  const chosen  = await choose(lang.prompt.selectProjectToDelete, projectNames);
  const project = all[projectNames.indexOf(chosen)];

  const ok = await confirm(lang.confirm.deleteProject(project.name));
  if (!ok) { console.log(lang.aborted); return; }

  try {
    db.delete(projects).where(eq(projects.id, project.id)).run();
  } catch (err) {
    logger.error("Failed to delete project", err);
    console.log(lang.dbError);
    return;
  }

  console.log(lang.success.projectDeleted(project.name));
}
