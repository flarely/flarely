export type DestinationType = "slack" | "discord" | "email";

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

export type DestinationConfig = SlackConfig | DiscordConfig | EmailConfig;
