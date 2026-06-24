import { createHash } from "crypto";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import basicAuth from "@fastify/basic-auth";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { config } from "./config.js";
import { notificationQueue } from "./queue/client.js";
import { healthRoute, ingestRoute, eventsRoute } from "./routes/index.js";

export interface BuildAppOptions {
  /**
   * Optional hook called after middleware is set up but before core routes are
   * registered. Use this in flarely-cloud to mount auth, dashboard, and billing
   * routes on the same Fastify instance.
   */
  extend?: (app: FastifyInstance) => Promise<void>;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // ── CORS — allow browser fetches from the landing page ───────────────────
  await app.register(cors, {
    origin: ["https://getflarely.dev", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "OPTIONS"],
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
  // Only mounts if BULLBOARD_USER + BULLBOARD_PASS are both set in env.
  // Disabled entirely if either is missing — no unauthenticated exposure.
  if (config.BULLBOARD_USER && config.BULLBOARD_PASS) {
    const boardAdapter = new FastifyAdapter();
    createBullBoard({
      queues: [new BullMQAdapter(notificationQueue)],
      serverAdapter: boardAdapter,
    });
    boardAdapter.setBasePath("/admin/queues");

    // Register basicAuth + BullBoard in the same scope so the decorator
    // is available when the onRequest hook runs
    await app.register(async (scope) => {
      await scope.register(basicAuth, {
        validate(username, password, _req, _reply, done) {
          if (
            username === config.BULLBOARD_USER &&
            password === config.BULLBOARD_PASS
          ) {
            return done();
          }
          return done(new Error("Unauthorized"));
        },
        authenticate: { realm: "Flarely Admin" },
      });

      scope.addHook("onRequest", scope.basicAuth);
      await scope.register(boardAdapter.registerPlugin(), {
        prefix: "/admin/queues",
      });
    });

    app.log.info("BullBoard dashboard enabled at /admin/queues");
  } else {
    app.log.warn(
      "BullBoard dashboard disabled — set BULLBOARD_USER and BULLBOARD_PASS to enable it"
    );
  }

  // ── Extension point (flarely-cloud and other consumers) ──────────────────
  if (options.extend) {
    await options.extend(app);
  }

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
