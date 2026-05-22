import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { connection } from "../queue/client.js";

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async (_request, reply) => {
    // Lightweight DB check — runs synchronously
    const dbOk = (() => {
      try {
        db.run("SELECT 1");
        return true;
      } catch {
        return false;
      }
    })();

    // Redis ping
    let redisOk = false;
    try {
      const pong = await connection.ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }

    const healthy = dbOk && redisOk;

    return reply.status(healthy ? 200 : 503).send({
      status: healthy ? "ok" : "degraded",
      checks: {
        db: dbOk ? "ok" : "error",
        redis: redisOk ? "ok" : "error",
      },
      timestamp: new Date().toISOString(),
    });
  });
};
