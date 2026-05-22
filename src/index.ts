import { buildApp } from "./server.js";
import { startWorker } from "./queue/worker.js";
import { notificationQueue } from "./queue/client.js";
import { config } from "./config.js";

async function main() {
  // ── Run DB migrations ─────────────────────────────────────────────────────
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("./db/index.js");
  const { fileURLToPath } = await import("url");
  const migrationsPath = fileURLToPath(
    new URL("./db/migrations", import.meta.url)
  );
  migrate(db, { migrationsFolder: migrationsPath });

  // ── Start HTTP server ─────────────────────────────────────────────────────
  const app = await buildApp();

  // ── Start queue worker ────────────────────────────────────────────────────
  const worker = startWorker();

  // ── Register repeatable dedup cleanup (every 5 minutes) ──────────────────
  await notificationQueue.add(
    "cleanup-dedup",
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "cleanup-dedup-repeatable", // stable ID prevents duplicates on restart
    }
  );

  // ── Listen ────────────────────────────────────────────────────────────────
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  console.log(`🔥 Flarely running on port ${config.PORT}`);

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    await app.close();
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
