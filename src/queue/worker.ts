import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { connection } from "./client.js";
import { getHandler } from "../handlers/registry.js";
import { db } from "../db/index.js";
import { events } from "../db/schema.js";
import { purgeExpiredDedup } from "../dedup/index.js";
import { config } from "../config.js";
import type { NotificationJob } from "../types/index.js";

async function processJob(job: Job): Promise<void> {
  // ── Cleanup job (repeatable, runs every 5 min) ──────────────────────────
  if (job.name === "cleanup-dedup") {
    // Use 2× the default window as a conservative expiry buffer so we don't
    // prune entries that belong to projects with a larger custom window.
    const deleted = purgeExpiredDedup(config.DEFAULT_DEDUP_WINDOW * 2);
    await job.log(`Purged ${deleted} expired dedup entries`);
    return;
  }

  // ── Notification delivery job ───────────────────────────────────────────
  const data = job.data as NotificationJob;
  const handler = getHandler(data.destination);

  try {
    await handler(data.config, data.payload);

    db.update(events)
      .set({ status: "delivered" })
      .where(eq(events.id, data.eventId))
      .run();
  } catch (err) {
    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

    if (isLastAttempt) {
      db.update(events)
        .set({ status: "failed" })
        .where(eq(events.id, data.eventId))
        .run();
    }

    throw err; // re-throw so BullMQ retries with backoff
  }
}

export function startWorker(): Worker {
  const worker = new Worker("notifications", processJob, {
    connection,
    concurrency: 5, // process up to 5 jobs in parallel
  });

  worker.on("completed", (job) => {
    console.log(`✅ [${job.name}] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [${job?.name}] job ${job?.id} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err.message);
  });

  return worker;
}
