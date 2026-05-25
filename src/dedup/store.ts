import { and, eq, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { dedupLog } from "../db/schema.js";

/**
 * Checks whether an event is a duplicate within the project's dedup window.
 *
 * Returns true  → duplicate, should be suppressed.
 * Returns false → new event (or window expired), should be delivered.
 *
 * Side-effect: always updates dedup_log (bump counter or reset window).
 */
export function checkAndRecordDedup(
  fingerprint: string,
  projectId: string,
  dedupWindowSecs: number
): boolean {
  const now = Math.floor(Date.now() / 1000);

  const existing = db
    .select()
    .from(dedupLog)
    .where(
      and(
        eq(dedupLog.fingerprint, fingerprint),
        eq(dedupLog.projectId, projectId)
      )
    )
    .get();

  if (existing && now - existing.firstSeenAt < dedupWindowSecs) {
    // Within window — suppress and bump hit counter
    db.update(dedupLog)
      .set({ hitCount: existing.hitCount + 1, lastSeenAt: now })
      .where(
        and(
          eq(dedupLog.fingerprint, fingerprint),
          eq(dedupLog.projectId, projectId)
        )
      )
      .run();
    return true;
  }

  // Outside window or first time — upsert and reset the window clock
  db.insert(dedupLog)
    .values({
      fingerprint,
      projectId,
      firstSeenAt: now,
      lastSeenAt: now,
      hitCount: 0,
    })
    .onConflictDoUpdate({
      target: [dedupLog.fingerprint, dedupLog.projectId],
      set: { firstSeenAt: now, lastSeenAt: now, hitCount: 0 },
    })
    .run();

  return false;
}

/**
 * Deletes dedup rows whose window has fully expired.
 * Called by the BullMQ repeatable cleanup job every 5 minutes.
 */
export function purgeExpiredDedup(maxWindowSecs: number): number {
  const cutoff = Math.floor(Date.now() / 1000) - maxWindowSecs;
  const result = db
    .delete(dedupLog)
    .where(lt(dedupLog.lastSeenAt, cutoff))
    .run();
  return result.changes;
}
