import { eq } from "drizzle-orm";
import { db, projects, apiKeys } from "../../db/index.js";

export async function listProjects(): Promise<void> {
  const all = db.select().from(projects).orderBy(projects.createdAt).all();

  if (all.length === 0) {
    console.log("\n  No projects yet. Run 'pnpm setup' to create one.\n");
    return;
  }

  console.log(`\n  ${"NAME".padEnd(20)} ${"DESTINATION".padEnd(10)} ${"DEDUP".padEnd(8)} KEYS`);
  console.log(`  ${"─".repeat(50)}`);

  for (const project of all) {
    const keyCount = db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.projectId, project.id))
      .all().length;

    console.log(
      `  ${project.name.padEnd(20)} ${project.destination.padEnd(10)} ${String(project.dedupWindow + "s").padEnd(8)} ${keyCount}`
    );
  }

  console.log();
}
