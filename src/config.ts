import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default("./data/flarely.db"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RESEND_API_KEY: z.string().optional(),
  DEFAULT_DEDUP_WINDOW: z.coerce.number().default(600), // seconds
  // BullBoard dashboard — if either is missing the dashboard is disabled
  BULLBOARD_USER: z.string().optional(),
  BULLBOARD_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
