import { appendFile } from "node:fs/promises";

export type LogFields = Record<string, unknown>;

const jsonReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;

export class KeeperLogger {
  constructor(private readonly logFile?: string) {}

  async write(level: "info" | "warn" | "error", event: string, fields: LogFields = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...fields,
    };
    const line = JSON.stringify(entry, jsonReplacer);

    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }

    if (this.logFile) {
      await appendFile(this.logFile, `${line}\n`, { encoding: "utf8", mode: 0o600 });
    }
  }
}

export function describeError(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message };
  }
  return { errorName: "UnknownError", errorMessage: String(error) };
}
