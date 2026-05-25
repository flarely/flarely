import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db, events } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import { buildFingerprint, checkAndRecordDedup } from "../dedup/index.js";
import { notificationQueue } from "../queue/client.js";
import type { NotificationJob, DestinationConfig } from "../types/index.js";

const ingestBodySchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().max(5000).optional(),
  level: z.enum(["info", "warn", "error", "critical"]),
  source: z.string().min(1).max(100),
  fingerprint: z.string().max(255).optional(),
});

export const ingestRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/ingest",
    { preHandler: [authenticate] },
    async (request, reply) => {
      // ── 1. Validate body ──────────────────────────────────────────────────
      const parsed = ingestBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const payload = parsed.data;
      const project = request.project;

      // ── 2. Resolve fingerprint ────────────────────────────────────────────
      const fingerprint =
        payload.fingerprint ??
        buildFingerprint(project.id, payload.title, payload.source, payload.level);

      // ── 3. Dedup check ────────────────────────────────────────────────────
      const destConfig: DestinationConfig = JSON.parse(project.config);
      const suppressed = checkAndRecordDedup(
        fingerprint,
        project.id,
        project.dedupWindow
      );

      const eventId = nanoid();

      // ── 4a. Suppressed — record it and return early ───────────────────────
      if (suppressed) {
        db.insert(events)
          .values({
            id: eventId,
            projectId: project.id,
            title: payload.title,
            message: payload.message,
            level: payload.level,
            source: payload.source,
            fingerprint,
            status: "suppressed",
          })
          .run();

        return reply.status(200).send({
          id: eventId,
          status: "suppressed",
          reason: "Duplicate within dedup window",
        });
      }

      // ── 4b. New event — persist + enqueue ─────────────────────────────────
      db.insert(events)
        .values({
          id: eventId,
          projectId: project.id,
          title: payload.title,
          message: payload.message,
          level: payload.level,
          source: payload.source,
          fingerprint,
          status: "queued",
        })
        .run();

      const job: NotificationJob = {
        eventId,
        projectId: project.id,
        destination: project.destination,
        config: destConfig,
        payload,
      };

      await notificationQueue.add("deliver", job, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // 2s → 4s → 8s
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      });

      return reply.status(202).send({ id: eventId, status: "queued" });
    }
  );
};
