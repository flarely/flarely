import { createHash } from "crypto";

/**
 * Auto-generates a dedup fingerprint from event properties.
 * Intentionally excludes `message` — so the same error with different
 * stack traces / varying details still deduplicates correctly.
 */
export function buildFingerprint(
  projectId: string,
  title: string,
  source: string,
  level: string
): string {
  return createHash("sha256")
    .update(`${projectId}:${title}:${source}:${level}`)
    .digest("hex")
    .slice(0, 32); // 32 hex chars = 128-bit, collision-resistant enough
}
