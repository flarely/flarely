import type { IngestPayload, TelegramConfig, DestinationConfig } from "../types/index.js";

const EMOJI: Record<string, string> = {
  info: "ℹ️",
  warn: "⚠️",
  error: "🚨",
  critical: "🔥",
};

export async function sendTelegram(
  destConfig: DestinationConfig,
  payload: IngestPayload
): Promise<void> {
  const { botToken, chatId } = destConfig as TelegramConfig;
  const emoji = EMOJI[payload.level] ?? "📣";

  const lines = [
    `${emoji} *[${payload.level.toUpperCase()}] ${escapeMarkdown(payload.title)}*`,
    `*Source:* ${escapeMarkdown(payload.source)}`,
  ];

  if (payload.message) {
    lines.push(`\`\`\`\n${payload.message}\n\`\`\``);
  }

  const text = lines.join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json() as { description?: string };
    throw new Error(`Telegram API error [${res.status}]: ${body.description ?? "unknown"}`);
  }
}

// Escape special Markdown characters for Telegram
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}
