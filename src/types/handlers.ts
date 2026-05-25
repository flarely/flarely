import type { DestinationConfig } from "./destinations.js";
import type { IngestPayload } from "./events.js";

export interface NotificationHandler {
  send(config: DestinationConfig, payload: IngestPayload): Promise<void>;
}
