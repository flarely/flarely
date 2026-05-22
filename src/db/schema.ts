import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ─── Projects ─────────────────────────────────────────────────────────────────
// One project = one destination (Slack, Discord, or email).
// Users can create multiple projects for different destinations / alert categories.

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), // nanoid
  name: text("name").notNull(),
  destination: text("destination", {
    enum: ["slack", "discord", "email"],
  }).notNull(),
  // JSON string: SlackConfig | DiscordConfig | EmailConfig
  config: text("config").notNull(),
  // Per-project dedup window override (seconds). Falls back to env default.
  dedupWindow: integer("dedup_window").notNull().default(600),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── API Keys ─────────────────────────────────────────────────────────────────
// Raw key shown once at creation. Only the sha256 hash is stored.

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(), // nanoid
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(), // sha256(rawKey)
  label: text("label"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Events ───────────────────────────────────────────────────────────────────
// Audit log of every ingest call, including suppressed ones.

export const events = sqliteTable("events", {
  id: text("id").primaryKey(), // nanoid
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message"),
  level: text("level", {
    enum: ["info", "warn", "error", "critical"],
  }).notNull(),
  source: text("source").notNull(),
  fingerprint: text("fingerprint").notNull(),
  status: text("status", {
    enum: ["queued", "delivered", "suppressed", "failed"],
  }).notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Dedup Log ────────────────────────────────────────────────────────────────
// Tracks the dedup window per (fingerprint, project).
// Rows are cleaned up by the periodic BullMQ repeatable job.

export const dedupLog = sqliteTable(
  "dedup_log",
  {
    fingerprint: text("fingerprint").notNull(),
    projectId: text("project_id").notNull(),
    firstSeenAt: integer("first_seen_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
    hitCount: integer("hit_count").notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.fingerprint, table.projectId] }),
  })
);

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type DedupLog = typeof dedupLog.$inferSelect;
