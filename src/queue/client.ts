import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config.js";

// Shared Redis connection — BullMQ requires maxRetriesPerRequest: null
export const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err: Error) => {
  console.error("Redis connection error:", err.message);
});

export const notificationQueue = new Queue("notifications", { connection });
