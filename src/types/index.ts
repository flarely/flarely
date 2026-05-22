// ─── Event levels ────────────────────────────────────────────────────────────

export type EventLevel = "info" | "warn" | "error" | "critical";

// ─── Destination types ────────────────────────────────────────────────────────

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

// ─── Ingest payload (what the client POSTs) ───────────────────────────────────

export interface IngestPayload {
  title: string;
  message?: string;
  level: EventLevel;
  source: string;
  fingerprint?: string;
}

// ─── Notification job (what goes into the BullMQ queue) ──────────────────────

export interface NotificationJob {
  eventId: string;
  projectId: string;
  destination: DestinationType;
  config: DestinationConfig;
  payload: IngestPayload;
}

// ─── Handler interface ────────────────────────────────────────────────────────

export interface NotificationHandler {
  send(config: DestinationConfig, payload: IngestPayload): Promise<void>;
}
