import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import { db, events } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";

const querySchema = z.object({
  status: z.enum(["queued", "delivered", "suppressed", "failed"]).optional(),
  level:  z.enum(["info", "warn", "error", "critical"]).optional(),
  limit:  z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const eventsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/events",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { status, level, limit, offset } = parsed.data;
      const projectId = request.project.id;

      // Build shared WHERE conditions
      const conditions = [
        eq(events.projectId, projectId),
        ...(status ? [eq(events.status, status)] : []),
        ...(level  ? [eq(events.level, level)]   : []),
      ];

      const where = and(...conditions);

      // Total count for pagination
      const [{ total }] = db
        .select({ total: count() })
        .from(events)
        .where(where)
        .all();

      // Paginated data
      const data = db
        .select()
        .from(events)
        .where(where)
        .orderBy(desc(events.createdAt))
        .limit(limit)
        .offset(offset)
        .all();

      return reply.send({ data, total, limit, offset });
    }
  );
};
