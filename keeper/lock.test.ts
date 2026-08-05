import assert from "node:assert/strict";
import { mkdtemp, readFile, rmdir, unlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { acquireProcessLock } from "./lock";

test("active lock rejects overlap and can be reacquired after release", async () => {
  const directory = await mkdtemp(join(tmpdir(), "zazu-keeper-lock-"));
  const lockPath = join(directory, "keeper.lock");
  const first = await acquireProcessLock(lockPath, 60_000);

  try {
    await assert.rejects(acquireProcessLock(lockPath, 60_000), {
      message: /Keeper lock is already held/,
    });

    await first.release();
    const second = await acquireProcessLock(lockPath, 60_000);
    await second.release();
  } finally {
    await first.release();
    await unlink(lockPath).catch(() => undefined);
    await rmdir(directory);
  }
});

test("stale lock takeover fails closed and preserves the existing owner", async () => {
  const directory = await mkdtemp(join(tmpdir(), "zazu-keeper-lock-"));
  const lockPath = join(directory, "keeper.lock");
  const existing = {
    id: "stale-owner",
    pid: 12345,
    hostname: "different-host",
    startedAt: "2026-01-01T00:00:00.000Z",
  };

  try {
    await writeFile(lockPath, `${JSON.stringify(existing)}\n`, { mode: 0o600 });
    const old = new Date(Date.now() - 120_000);
    await utimes(lockPath, old, old);

    await assert.rejects(acquireProcessLock(lockPath, 60_000), {
      message: /Automatic takeover is disabled/,
    });
    assert.equal(JSON.parse(await readFile(lockPath, "utf8")).id, existing.id);
  } finally {
    await unlink(lockPath).catch(() => undefined);
    await rmdir(directory);
  }
});
