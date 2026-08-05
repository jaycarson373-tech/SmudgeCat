import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { open, readFile, unlink, utimes } from "node:fs/promises";

interface LockContents {
  id: string;
  pid: number;
  hostname: string;
  startedAt: string;
}

export interface ProcessLock {
  release(): Promise<void>;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function readLock(path: string): Promise<LockContents | undefined> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as Partial<LockContents>;
    if (
      typeof parsed.id !== "string" ||
      !Number.isSafeInteger(parsed.pid) ||
      typeof parsed.hostname !== "string" ||
      typeof parsed.startedAt !== "string"
    ) {
      return undefined;
    }
    return parsed as LockContents;
  } catch {
    return undefined;
  }
}

export async function acquireProcessLock(
  path: string,
  staleAfterMs: number,
): Promise<ProcessLock> {
  const contents: LockContents = {
    id: randomUUID(),
    pid: process.pid,
    hostname: hostname(),
    startedAt: new Date().toISOString(),
  };

  try {
    const handle = await open(path, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify(contents)}\n`, "utf8");
    await handle.close();

    const heartbeatMs = Math.max(10_000, Math.floor(staleAfterMs / 3));
    const heartbeat = setInterval(() => {
      const now = new Date();
      void utimes(path, now, now).catch(() => undefined);
    }, heartbeatMs);
    heartbeat.unref();

    return {
      async release() {
        clearInterval(heartbeat);
        const current = await readLock(path);
        if (current?.id === contents.id) {
          await unlink(path).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== "ENOENT") throw error;
          });
        }
      },
    };
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code !== "EEXIST") throw error;

    const existing = await readLock(path);
    const sameHostAlive =
      existing?.hostname === hostname() &&
      Number.isSafeInteger(existing.pid) &&
      isProcessAlive(existing.pid);

    let stale = false;
    try {
      const handle = await open(path, "r");
      const stat = await handle.stat();
      await handle.close();
      stale = Date.now() - stat.mtimeMs > staleAfterMs;
    } catch {
      stale = true;
    }

    if (sameHostAlive || !stale) {
      throw new Error(
        `Keeper lock is already held at ${path}` +
          (existing ? ` by pid ${existing.pid} on ${existing.hostname}` : ""),
      );
    }

    throw new Error(
      `Keeper lock at ${path} appears stale. Automatic takeover is disabled to prevent concurrent execution. Verify that no keeper is running, then remove this exact lock file manually.`,
    );
  }
}
