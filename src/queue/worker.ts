import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { connection } from "./client.js";
import { getHandler } from "../handlers/registry.js";
import { db } from "../db/index.js";
import { events } from "../db/schema.js";
import { purgeExpiredDedup } from "../dedup/index.js";
import { config } from "../config.js";
import { logger } from "../logger.js";
import {
  QUEUE_NAME,
  WORKER_CONCURRENCY,
  CLEANUP_JOB_NAME,
  DEDUP_CLEANUP_BUFFER_MULTIPLIER,
} from "../constants.js";
import type { NotificationJob } from "../types/index.js";

async function processJob(job: Job): Promise<void> {
  if (job.name === CLEANUP_JOB_NAME) {
    const deleted = purgeExpiredDedup(config.DEFAULT_DEDUP_WINDOW * DEDUP_CLEANUP_BUFFER_MULTIPLIER);
    await job.log(`Purged ${deleted} expired dedup entries`);
    return;
  }

  const data    = job.data as NotificationJob;
  const handler = getHandler(data.destination);

  try {
    await handler(data.config, data.payload);
    db.update(events).set({ status: "delivered" }).where(eq(events.id, data.eventId)).run();
  } catch (err) {
    const maxAttempts  = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

    if (isLastAttempt) {
      db.update(events).set({ status: "failed" }).where(eq(events.id, data.eventId)).run();
    }

    throw err;
  }
}

export function startWorker(): Worker {
  const worker = new Worker(QUEUE_NAME, processJob, {
    connection,
    concurrency: WORKER_CONCURRENCY,
  });

  worker.on("completed", (job) => {
    logger.info(`[${job.name}] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[${job?.name ?? "unknown"}] job ${job?.id ?? "?"} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    logger.error("Worker error", err);
  });

  return worker;
}
