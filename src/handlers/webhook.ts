import type { IngestPayload, WebhookConfig, DestinationConfig } from "../types/index.js";

export async function sendWebhook(
  destConfig: DestinationConfig,
  payload: IngestPayload
): Promise<void> {
  const { url, headers: customHeaders = {} } = destConfig as WebhookConfig;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Flarely/1.0",
      ...customHeaders,
    },
    body: JSON.stringify({
      title: payload.title,
      message: payload.message,
      level: payload.level,
      source: payload.source,
      fingerprint: payload.fingerprint,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook delivery failed [${res.status}]: ${text}`);
  }
}
