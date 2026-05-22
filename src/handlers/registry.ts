import type { DestinationType, DestinationConfig, IngestPayload } from "../types/index.js";
import { sendSlack } from "./slack.js";
import { sendDiscord } from "./discord.js";
import { sendEmail } from "./email.js";

type HandlerFn = (config: DestinationConfig, payload: IngestPayload) => Promise<void>;

const registry: Record<DestinationType, HandlerFn> = {
  slack: sendSlack,
  discord: sendDiscord,
  email: sendEmail,
};

export function getHandler(destination: DestinationType): HandlerFn {
  const handler = registry[destination];
  if (!handler) throw new Error(`No handler registered for destination: "${destination}"`);
  return handler;
}
