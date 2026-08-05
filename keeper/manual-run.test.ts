import assert from "node:assert/strict";
import test from "node:test";
import {
  assertManualRunEnvironment,
  manualAcknowledgement,
  prepareManualRunEnvironment,
  type KeeperEnvironment,
} from "./manual-run";

const VAULT = "0x1111111111111111111111111111111111111111";
const CHAIN_ID = "4663";

test("manual entrypoint defaults to one guarded dry-run cycle", () => {
  const environment: KeeperEnvironment = { BUYBACK_VAULT_ADDRESS: VAULT, CHAIN_ID };

  const guard = prepareManualRunEnvironment(environment);

  assert.equal(environment.KEEPER_MANUAL_RUN, "true");
  assert.equal(environment.KEEPER_RUN_ONCE, "true");
  assert.equal(environment.KEEPER_DRY_RUN, "true");
  assert.equal(guard.dryRun, true);
  assert.equal(guard.vaultAddress, VAULT);
});

test("live manual execution requires proof that automation was stopped", () => {
  const environment = {
    BUYBACK_VAULT_ADDRESS: VAULT,
    CHAIN_ID,
    KEEPER_MANUAL_RUN: "true",
    KEEPER_RUN_ONCE: "true",
    KEEPER_DRY_RUN: "false",
    KEEPER_MANUAL_REASON: "Recovering after the automatic worker stopped.",
  };

  assert.throws(
    () => assertManualRunEnvironment(environment),
    /KEEPER_MANUAL_ACK=AUTOMATION_STOPPED:/,
  );
});

test("live manual execution accepts the exact vault-bound acknowledgement", () => {
  const environment = {
    BUYBACK_VAULT_ADDRESS: VAULT,
    CHAIN_ID,
    KEEPER_MANUAL_RUN: "true",
    KEEPER_RUN_ONCE: "true",
    KEEPER_DRY_RUN: "false",
    KEEPER_MANUAL_ACK: manualAcknowledgement(Number(CHAIN_ID), VAULT),
    KEEPER_MANUAL_EXPECTED_NONCE: "7",
    KEEPER_MANUAL_REASON: "Recovering after the automatic worker stopped.",
  };

  const guard = assertManualRunEnvironment(environment);

  assert.equal(guard.dryRun, false);
  assert.equal(guard.expectedNonce, 7);
  assert.equal(guard.manualReason, environment.KEEPER_MANUAL_REASON);
});

test("manual execution can never become a continuous keeper", () => {
  assert.throws(
    () =>
      assertManualRunEnvironment({
        BUYBACK_VAULT_ADDRESS: VAULT,
        CHAIN_ID,
        KEEPER_MANUAL_RUN: "true",
        KEEPER_RUN_ONCE: "false",
      }),
    /KEEPER_RUN_ONCE=true/,
  );
});

test("live manual execution records a useful reason", () => {
  assert.throws(
    () =>
      assertManualRunEnvironment({
        BUYBACK_VAULT_ADDRESS: VAULT,
        CHAIN_ID,
        KEEPER_MANUAL_RUN: "true",
        KEEPER_RUN_ONCE: "true",
        KEEPER_DRY_RUN: "false",
        KEEPER_MANUAL_ACK: manualAcknowledgement(Number(CHAIN_ID), VAULT),
        KEEPER_MANUAL_EXPECTED_NONCE: "7",
        KEEPER_MANUAL_REASON: "short",
      }),
    /between 8 and 200 characters/,
  );
});

test("live manual execution requires an expected signer nonce", () => {
  assert.throws(
    () =>
      assertManualRunEnvironment({
        BUYBACK_VAULT_ADDRESS: VAULT,
        CHAIN_ID,
        KEEPER_MANUAL_RUN: "true",
        KEEPER_RUN_ONCE: "true",
        KEEPER_DRY_RUN: "false",
        KEEPER_MANUAL_ACK: manualAcknowledgement(Number(CHAIN_ID), VAULT),
        KEEPER_MANUAL_REASON: "Recovering after the automatic worker stopped.",
      }),
    /KEEPER_MANUAL_EXPECTED_NONCE/,
  );
});
