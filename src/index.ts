import { buildApp } from "./server.js";
import { startWorker } from "./queue/worker.js";
import { notificationQueue } from "./queue/client.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { CLEANUP_JOB_NAME, CLEANUP_JOB_ID, CLEANUP_INTERVAL_MS } from "./constants.js";

async function main() {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db }      = await import("./db/index.js");
  const { fileURLToPath } = await import("url");
  const migrationsPath = fileURLToPath(new URL("./db/migrations", import.meta.url));
  migrate(db, { migrationsFolder: migrationsPath });

  const app    = await buildApp();
  const worker = startWorker();

  await notificationQueue.add(
    CLEANUP_JOB_NAME,
    {},
    {
      repeat: { every: CLEANUP_INTERVAL_MS },
      jobId: CLEANUP_JOB_ID,
    }
  );

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  logger.info(`🔥 Flarely running on port ${config.PORT}`);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    await app.close();
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT",  () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Fatal startup error", err);
  process.exit(1);
});
