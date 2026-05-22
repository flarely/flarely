import { Resend } from "resend";
import { config } from "../config.js";
import type { IngestPayload, EmailConfig, DestinationConfig } from "../types/index.js";

const EMOJI: Record<string, string> = {
  info: "ℹ️",
  warn: "⚠️",
  error: "🚨",
  critical: "🔥",
};

const BORDER_COLOR: Record<string, string> = {
  info: "#0099ff",
  warn: "#ffcc00",
  error: "#ff3333",
  critical: "#990000",
};

function buildHtml(payload: IngestPayload): string {
  const emoji = EMOJI[payload.level] ?? "📣";
  const border = BORDER_COLOR[payload.level] ?? "#888888";

  return `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="border-left: 4px solid ${border}; padding: 16px 20px; background: #f9f9f9; border-radius: 4px;">
        <h2 style="margin: 0 0 12px; font-size: 18px;">${emoji} ${payload.title}</h2>
        <table style="border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 3px 16px 3px 0; color: #666; white-space: nowrap;">Level</td>
            <td style="padding: 3px 0;"><strong>${payload.level}</strong></td>
          </tr>
          <tr>
            <td style="padding: 3px 16px 3px 0; color: #666; white-space: nowrap;">Source</td>
            <td style="padding: 3px 0;"><strong>${payload.source}</strong></td>
          </tr>
          <tr>
            <td style="padding: 3px 16px 3px 0; color: #666; white-space: nowrap;">Time</td>
            <td style="padding: 3px 0;">${new Date().toUTCString()}</td>
          </tr>
        </table>
        ${
          payload.message
            ? `<pre style="margin: 16px 0 0; background: #fff; border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px; font-size: 13px; overflow: auto; white-space: pre-wrap; word-break: break-word;">${payload.message}</pre>`
            : ""
        }
      </div>
      <p style="font-size: 12px; color: #aaa; margin-top: 16px;">Sent by Flarely</p>
    </div>
  `.trim();
}

export async function sendEmail(
  destConfig: DestinationConfig,
  payload: IngestPayload
): Promise<void> {
  if (!config.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set — cannot send email");
  }

  const { to, from } = destConfig as EmailConfig;
  const emoji = EMOJI[payload.level] ?? "📣";
  const resend = new Resend(config.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${emoji} [${payload.level.toUpperCase()}] ${payload.title}`,
    html: buildHtml(payload),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
