import { ask } from "./prompt.js";
import { lang } from "../lang/index.js";
import type { DestinationType } from "../../constants.js";

export async function collectDestinationConfig(
  destination: DestinationType
): Promise<Record<string, string>> {
  const config: Record<string, string> = {};

  if (destination === "slack" || destination === "discord") {
    config.webhookUrl = await ask(lang.prompt.webhookUrl);
  } else if (destination === "email") {
    config.to   = await ask(lang.prompt.emailTo);
    config.from = await ask(lang.prompt.emailFrom);
  } else if (destination === "telegram") {
    config.botToken = await ask(lang.prompt.botToken);
    config.chatId   = await ask(lang.prompt.chatId);
  } else if (destination === "webhook") {
    config.url = await ask(lang.prompt.webhookUrl);
  }

  return config;
}
