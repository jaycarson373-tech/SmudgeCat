import assert from "node:assert/strict";
import test from "node:test";
import { loadKeeperConfig } from "./config";
import { manualAcknowledgement } from "./manual-run";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const VAULT = "0x2222222222222222222222222222222222222222";

const baseEnvironment: Record<string, string> = {
  ROBINHOOD_RPC_URL: "https://rpc.example",
  CHAIN_ID: "4663",
  BUYBACK_VAULT_ADDRESS: VAULT,
  PONS_FEE_COLLECTOR_ADDRESS: ADDRESS,
  PONS_LOCKER_ADDRESS: ADDRESS,
  KEEPER_ADDRESS: ADDRESS,
  ZAZU_TOKEN_ADDRESS: ADDRESS,
  DEX_ROUTER_ADDRESS: ADDRESS,
  WRAPPED_NATIVE_ADDRESS: ADDRESS,
  BUYBACK_DESTINATION: ADDRESS,
  FEE_TOKEN_ADDRESS: ADDRESS,
  MIN_EXECUTION_AMOUNT: "1",
  MAX_EXECUTION_AMOUNT: "2",
  MAX_SLIPPAGE_BPS: "100",
  KEEPER_QUOTE_API_URL: "https://quotes.example",
  KEEPER_MAX_PRICE_IMPACT_BPS: "100",
  KEEPER_MAX_GAS_UNITS: "500000",
  KEEPER_MAX_GAS_COST_WEI: "1000000000000000",
};

async function withEnvironment(
  overrides: Record<string, string | undefined>,
  action: () => void,
): Promise<void> {
  const values = { ...baseEnvironment, ...overrides };
  const original = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    original.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    action();
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("dry-run ignores a configured private key and requires the public keeper", async () => {
  await withEnvironment(
    {
      KEEPER_DRY_RUN: "true",
      KEEPER_PRIVATE_KEY: "this-is-intentionally-not-a-private-key",
      KEEPER_MANUAL_RUN: undefined,
      KEEPER_RUN_ONCE: "false",
    },
    () => {
      const config = loadKeeperConfig();
      assert.equal(config.privateKey, undefined);
      assert.equal(config.keeperAddress, ADDRESS);
      assert.equal(config.executionMode, "automatic");
    },
  );
});

test("live automatic mode requires a valid signing key", async () => {
  await withEnvironment(
    {
      KEEPER_DRY_RUN: "false",
      KEEPER_PRIVATE_KEY: undefined,
      KEEPER_MANUAL_RUN: undefined,
      KEEPER_RUN_ONCE: "false",
    },
    () => assert.throws(() => loadKeeperConfig(), /KEEPER_PRIVATE_KEY/),
  );
});

test("automatic mode requires an explicit dry-run decision", async () => {
  await withEnvironment(
    {
      KEEPER_DRY_RUN: undefined,
      KEEPER_PRIVATE_KEY: `0x${"11".repeat(32)}`,
      KEEPER_MANUAL_RUN: undefined,
      KEEPER_RUN_ONCE: "false",
    },
    () => assert.throws(() => loadKeeperConfig(), /must be explicitly set/),
  );
});

test("manual mode defaults to dry-run even when the wrapper is bypassed", async () => {
  await withEnvironment(
    {
      KEEPER_DRY_RUN: undefined,
      KEEPER_PRIVATE_KEY: `0x${"11".repeat(32)}`,
      KEEPER_MANUAL_RUN: "true",
      KEEPER_RUN_ONCE: "true",
      KEEPER_MANUAL_ACK: undefined,
      KEEPER_MANUAL_EXPECTED_NONCE: undefined,
      KEEPER_MANUAL_REASON: undefined,
    },
    () => {
      const config = loadKeeperConfig();
      assert.equal(config.dryRun, true);
      assert.equal(config.privateKey, undefined);
      assert.equal(config.keeperAddress, ADDRESS);
      assert.equal(config.executionMode, "manual");
    },
  );
});

test("unguarded live one-cycle execution is rejected", async () => {
  await withEnvironment(
    {
      KEEPER_DRY_RUN: "false",
      KEEPER_PRIVATE_KEY: `0x${"11".repeat(32)}`,
      KEEPER_MANUAL_RUN: undefined,
      KEEPER_RUN_ONCE: "true",
    },
    () => assert.throws(() => loadKeeperConfig(), /guarded manual entrypoint/),
  );
});

test("live manual mode carries the guarded expected nonce into the keeper", async () => {
  await withEnvironment(
    {
      KEEPER_DRY_RUN: "false",
      KEEPER_PRIVATE_KEY: `0x${"11".repeat(32)}`,
      KEEPER_MANUAL_RUN: "true",
      KEEPER_RUN_ONCE: "true",
      KEEPER_MANUAL_ACK: manualAcknowledgement(4663, VAULT),
      KEEPER_MANUAL_EXPECTED_NONCE: "9",
      KEEPER_MANUAL_REASON: "Recovering after the automatic worker stopped.",
    },
    () => {
      const config = loadKeeperConfig();
      assert.equal(config.executionMode, "manual");
      assert.equal(config.runOnce, true);
      assert.equal(config.manualExpectedNonce, 9);
    },
  );
});
