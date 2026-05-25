import type { DestinationType, DestinationConfig, IngestPayload } from "../types/index.js";
import { sendSlack } from "./slack.js";
import { sendDiscord } from "./discord.js";
import { sendEmail } from "./email.js";
import { sendTelegram } from "./telegram.js";
import { sendWebhook } from "./webhook.js";

type HandlerFn = (config: DestinationConfig, payload: IngestPayload) => Promise<void>;

const registry: Record<DestinationType, HandlerFn> = {
  slack:    sendSlack,
  discord:  sendDiscord,
  email:    sendEmail,
  telegram: sendTelegram,
  webhook:  sendWebhook,
};

export function getHandler(destination: DestinationType): HandlerFn {
  const handler = registry[destination];
  if (!handler) throw new Error(`No handler registered for destination: "${destination}"`);
  return handler;
}
