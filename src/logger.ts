export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function minLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LEVEL_RANK) return env;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function emit(level: LogLevel, msg: string, err?: unknown): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[minLevel()]) return;
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${level.toUpperCase().padEnd(5)}] ${msg}`);
  if (err instanceof Error) console.error(err.stack);
  else if (err !== undefined) console.error(err);
}

export const logger = {
  debug: (msg: string) => emit("debug", msg),
  info:  (msg: string) => emit("info", msg),
  warn:  (msg: string) => emit("warn", msg),
  error: (msg: string, err?: unknown) => emit("error", msg, err),
};
