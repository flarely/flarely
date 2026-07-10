export const DESTINATION_TYPES = [
  "slack",
  "discord",
  "email",
  "telegram",
  "webhook",
] as const;
export type DestinationType = (typeof DESTINATION_TYPES)[number];

export const DEFAULT_DEDUP_WINDOW_SECONDS = 600;
export const API_KEY_PREFIX = "sk_live_";
export const DEFAULT_API_KEY_LABEL = "default";

export const QUEUE_NAME = "notifications";
export const CLEANUP_JOB_NAME = "cleanup-dedup";
export const CLEANUP_JOB_ID = "cleanup-dedup-repeatable";
export const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
export const WORKER_CONCURRENCY = 5;

export const RATE_LIMIT_MAX = 100;
export const RATE_LIMIT_WINDOW = "1 minute";

export const JOB_ATTEMPTS = 3;
export const JOB_BACKOFF_DELAY_MS = 2000;
export const JOB_REMOVE_ON_COMPLETE = 100;
export const JOB_REMOVE_ON_FAIL = 50;

export const DEDUP_CLEANUP_BUFFER_MULTIPLIER = 2;
