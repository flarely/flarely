import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db, projects, apiKeys } from "../../db/index.js";
import { ask, choose } from "../utils/index.js";

export async function addApiKey(): Promise<void> {
  const all = db.select().from(projects).all();

  if (all.length === 0) {
    console.log("\n  No projects found. Create one first.\n");
    return;
  }

  console.log();
  const projectNames = all.map((p) => p.name);
  const chosen       = await choose("Select project:", projectNames);
  const project      = all[projectNames.indexOf(chosen)];

  const label = await ask("Key label (e.g. production, staging): ");

  const rawKey  = `sk_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  db.insert(apiKeys)
    .values({
      id: nanoid(),
      projectId: project.id,
      keyHash,
      label: label || null,
    })
    .run();

  const keyCount = db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.projectId, project.id))
    .all().length;

  console.log(`\n  ✅ New API key added to "${project.name}" (${keyCount} key${keyCount > 1 ? "s" : ""} total)\n`);
  console.log(`  API Key (shown once — save it now):\n`);
  console.log(`  ${rawKey}\n`);
}
