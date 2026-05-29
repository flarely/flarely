/**
 * Flarely — importable library surface.
 *
 * This is the entry point for consumers that embed Flarely (e.g. flarely-cloud).
 * It exports everything needed to build on top of the core without forking it.
 *
 * The standalone server entry point is src/index.ts — it is NOT exported here.
 */

// ── App factory ───────────────────────────────────────────────────────────────
export { buildApp, type BuildAppOptions } from "./server.js";

// ── Database ──────────────────────────────────────────────────────────────────
export { db } from "./db/index.js";
export * from "./db/schema.js";

// ── Queue ─────────────────────────────────────────────────────────────────────
export { notificationQueue, connection } from "./queue/client.js";
export { startWorker } from "./queue/worker.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export * from "./types/index.js";

// ── Config ────────────────────────────────────────────────────────────────────
export { config, type Config } from "./config.js";
