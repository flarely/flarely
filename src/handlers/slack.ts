import type { IngestPayload, SlackConfig, DestinationConfig } from "../types/index.js";

const EMOJI: Record<string, string> = {
  info: "ℹ️",
  warn: "⚠️",
  error: "🚨",
  critical: "🔥",
};

export async function sendSlack(
  destConfig: DestinationConfig,
  payload: IngestPayload
): Promise<void> {
  const { url: webhookUrl } = destConfig as SlackConfig;
  const emoji = EMOJI[payload.level] ?? "📣";

  const body = {
    // Fallback text for notifications / accessibility
    text: `${emoji} *[${payload.level.toUpperCase()}]* ${payload.title} — ${payload.source}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${payload.title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Level:*\n${payload.level}` },
          { type: "mrkdwn", text: `*Source:*\n${payload.source}` },
        ],
      },
      ...(payload.message
        ? [
            {
              type: "section",
              text: { type: "mrkdwn", text: `\`\`\`${payload.message}\`\`\`` },
            },
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Sent by *Flarely* · ${new Date().toUTCString()}`,
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack webhook failed [${res.status}]: ${text}`);
  }
}
