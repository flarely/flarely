export type EventLevel = "info" | "warn" | "error" | "critical";

export interface IngestPayload {
  title: string;
  message?: string;
  level: EventLevel;
  source: string;
  fingerprint?: string;
}
