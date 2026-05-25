import { eq } from "drizzle-orm";
import { db, projects } from "../../db/index.js";
import { choose, confirm } from "../utils/index.js";

export async function deleteProject(): Promise<void> {
  const all = db.select().from(projects).all();

  if (all.length === 0) {
    console.log("\n  No projects found.\n");
    return;
  }

  console.log();
  const projectNames = all.map((p) => p.name);
  const chosen       = await choose("Select project to delete:", projectNames);
  const project      = all[projectNames.indexOf(chosen)];

  const ok = await confirm(
    `\n  ⚠️  Delete "${project.name}"? This removes all its API keys, events, and dedup history.`
  );
  if (!ok) { console.log("  Aborted.\n"); return; }

  // Cascade in schema handles api_keys, events, dedup_log
  db.delete(projects).where(eq(projects.id, project.id)).run();

  console.log(`\n  ✅ Project "${project.name}" deleted.\n`);
}
