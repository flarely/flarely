import { eq } from "drizzle-orm";
import { db, projects, apiKeys } from "../../db/index.js";
import { choose, confirm } from "../utils/index.js";

export async function revokeApiKey(): Promise<void> {
  const all = db.select().from(projects).all();

  if (all.length === 0) {
    console.log("\n  No projects found.\n");
    return;
  }

  console.log();
  const projectNames = all.map((p) => p.name);
  const chosen       = await choose("Select project:", projectNames);
  const project      = all[projectNames.indexOf(chosen)];

  const keys = db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.projectId, project.id))
    .all();

  if (keys.length === 0) {
    console.log(`\n  No API keys found for "${project.name}".\n`);
    return;
  }

  // Show keys as "label — id (last 8 chars)"
  const keyLabels = keys.map(
    (k) => `${(k.label ?? "unlabelled").padEnd(16)}  id: ...${k.id.slice(-8)}`
  );
  const chosenLabel = await choose("\nSelect key to revoke:", keyLabels);
  const keyToRevoke = keys[keyLabels.indexOf(chosenLabel)];

  const ok = await confirm(
    `\n  ⚠️  Revoke key "${keyToRevoke.label ?? keyToRevoke.id}"? This cannot be undone.`
  );
  if (!ok) { console.log("  Aborted.\n"); return; }

  db.delete(apiKeys).where(eq(apiKeys.id, keyToRevoke.id)).run();

  console.log(`\n  ✅ API key revoked. Any requests using it will now return 401.\n`);
}
