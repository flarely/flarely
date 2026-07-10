import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { QUEUE_NAME } from "../constants.js";

export const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: config.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

connection.on("error", (err: Error) => {
  logger.error("Redis connection error", err);
});

export const notificationQueue = new Queue(QUEUE_NAME, { connection });
