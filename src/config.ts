import "dotenv/config";
import { z } from "zod";
import { logger } from "./logger.js";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default("./data/flarely.db"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RESEND_API_KEY: z.string().optional(),
  DEFAULT_DEDUP_WINDOW: z.coerce.number().default(600),
  BULLBOARD_USER: z.string().optional(),
  BULLBOARD_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error("Invalid environment variables:");
  logger.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
