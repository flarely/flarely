import type { IngestPayload, DiscordConfig, DestinationConfig } from "../types/index.js";

// Discord embed colors per level
const COLORS: Record<string, number> = {
  info: 0x0099ff,     // blue
  warn: 0xffcc00,     // yellow
  error: 0xff3333,    // red
  critical: 0x990000, // dark red
};

const EMOJI: Record<string, string> = {
  info: "ℹ️",
  warn: "⚠️",
  error: "🚨",
  critical: "🔥",
};

export async function sendDiscord(
  destConfig: DestinationConfig,
  payload: IngestPayload
): Promise<void> {
  const { webhookUrl } = destConfig as DiscordConfig;
  const color = COLORS[payload.level] ?? 0x888888;
  const emoji = EMOJI[payload.level] ?? "📣";

  const body = {
    embeds: [
      {
        title: `${emoji} ${payload.title}`,
        description: payload.message
          ? `\`\`\`${payload.message}\`\`\``
          : undefined,
        color,
        fields: [
          { name: "Level", value: payload.level, inline: true },
          { name: "Source", value: payload.source, inline: true },
        ],
        footer: { text: "Flarely" },
        timestamp: new Date().toISOString(),
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
    throw new Error(`Discord webhook failed [${res.status}]: ${text}`);
  }
}
