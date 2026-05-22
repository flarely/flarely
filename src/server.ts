import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { healthRoute } from "./routes/health.js";
import { ingestRoute } from "./routes/ingest.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // ── Security headers ──────────────────────────────────────────────────────
  await app.register(helmet);

  // ── Rate limiting (per IP) ────────────────────────────────────────────────
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too many requests — please slow down",
    }),
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(healthRoute);
  await app.register(ingestRoute, { prefix: "/v1" });

  // ── 404 fallback ──────────────────────────────────────────────────────────
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: "Not found" });
  });

  return app;
}
