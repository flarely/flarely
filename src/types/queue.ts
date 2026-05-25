import type { DestinationType, DestinationConfig } from "./destinations.js";
import type { IngestPayload } from "./events.js";

export interface NotificationJob {
  eventId: string;
  projectId: string;
  destination: DestinationType;
  config: DestinationConfig;
  payload: IngestPayload;
}
