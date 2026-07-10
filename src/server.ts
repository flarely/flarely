import { createHash } from "crypto";
import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import basicAuth from "@fastify/basic-auth";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { config } from "./config.js";
import { notificationQueue } from "./queue/client.js";
import { healthRoute, ingestRoute, eventsRoute } from "./routes/index.js";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from "./constants.js";

export interface BuildAppOptions {
  extend?: (app: FastifyInstance) => Promise<void>;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(rateLimit, {
    max: RATE_LIMIT_MAX,
    timeWindow: RATE_LIMIT_WINDOW,
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

  if (config.BULLBOARD_USER && config.BULLBOARD_PASS) {
    const boardAdapter = new FastifyAdapter();
    createBullBoard({
      queues: [new BullMQAdapter(notificationQueue)],
      serverAdapter: boardAdapter,
    });
    boardAdapter.setBasePath("/admin/queues");

    await app.register(async (scope) => {
      await scope.register(basicAuth, {
        validate(username, password, _req, _reply, done) {
          if (username === config.BULLBOARD_USER && password === config.BULLBOARD_PASS) {
            return done();
          }
          return done(new Error("Unauthorized"));
        },
        authenticate: { realm: "Flarely Admin" },
      });

      scope.addHook("onRequest", scope.basicAuth);
      await scope.register(boardAdapter.registerPlugin(), { prefix: "/admin/queues" });
    });

    app.log.info("BullBoard dashboard enabled at /admin/queues");
  } else {
    app.log.warn(
      "BullBoard dashboard disabled — set BULLBOARD_USER and BULLBOARD_PASS to enable it"
    );
  }

  if (options.extend) {
    await options.extend(app);
  }

  await app.register(healthRoute);
  await app.register(ingestRoute, { prefix: "/v1" });
  await app.register(eventsRoute, { prefix: "/v1" });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: "Not found" });
  });

  return app;
}
