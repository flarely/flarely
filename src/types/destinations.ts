export type DestinationType = "slack" | "discord" | "email" | "telegram" | "webhook";

export interface SlackConfig {
  webhookUrl: string;
}

export interface DiscordConfig {
  webhookUrl: string;
}

export interface EmailConfig {
  to: string;
  from: string; // e.g. "Flarely <alerts@yourdomain.com>"
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>; // optional custom headers
}

export type DestinationConfig =
  | SlackConfig
  | DiscordConfig
  | EmailConfig
  | TelegramConfig
  | WebhookConfig;
