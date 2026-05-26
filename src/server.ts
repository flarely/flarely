import { createHash } from "crypto";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { config } from "./config.js";
import { notificationQueue } from "./queue/client.js";
import { healthRoute, ingestRoute, eventsRoute } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // ── Security headers ──────────────────────────────────────────────────────
  await app.register(helmet, {
    // Relax CSP so BullBoard UI assets load correctly
    contentSecurityPolicy: false,
  });

  // ── Rate limiting — per API key (falls back to IP for unauthenticated) ────
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      const auth = request.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        // Hash the raw key — keeps it consistent with how we store it
        return createHash("sha256").update(auth.slice(7).trim()).digest("hex");
      }
      return request.ip;
    },
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too many requests — please slow down",
    }),
  });

  // ── BullBoard queue dashboard ─────────────────────────────────────────────
  const boardAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(notificationQueue)],
    serverAdapter: boardAdapter,
  });
  boardAdapter.setBasePath("/admin/queues");
  await app.register(boardAdapter.registerPlugin(), { prefix: "/admin/queues" });

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(healthRoute);
  await app.register(ingestRoute, { prefix: "/v1" });
  await app.register(eventsRoute, { prefix: "/v1" });

  // ── 404 fallback ──────────────────────────────────────────────────────────
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: "Not found" });
  });

  return app;
}
