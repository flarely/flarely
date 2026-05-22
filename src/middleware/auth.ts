import type { FastifyRequest, FastifyReply } from "fastify";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { apiKeys, projects } from "../db/schema.js";
import type { Project } from "../db/schema.js";

// Augment FastifyRequest so request.project is typed everywhere
declare module "fastify" {
  interface FastifyRequest {
    project: Project;
  }
}

/**
 * Fastify preHandler hook.
 * Validates the Bearer token, resolves the project, and attaches it to
 * the request. Returns 401 immediately on any auth failure.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    reply
      .status(401)
      .send({ error: "Missing or invalid Authorization header" });
    return;
  }

  const rawKey = authHeader.slice(7).trim();
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  // Single indexed lookup — O(1)
  const result = db
    .select({ project: projects })
    .from(apiKeys)
    .innerJoin(projects, eq(apiKeys.projectId, projects.id))
    .where(eq(apiKeys.keyHash, keyHash))
    .get();

  if (!result) {
    reply.status(401).send({ error: "Invalid API key" });
    return;
  }

  request.project = result.project;
}
