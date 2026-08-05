import assert from "node:assert/strict";
import test from "node:test";
import { assertManualNonceState } from "./manual-nonce";

test("manual nonce guard accepts one fully reconciled nonce", () => {
  assert.doesNotThrow(() =>
    assertManualNonceState({
      expectedNonce: 7,
      latestNonce: 7,
      pendingNonce: 7,
      phase: "buyback",
    }),
  );
});

test("manual nonce guard rejects a pending transaction", () => {
  assert.throws(
    () =>
      assertManualNonceState({
        expectedNonce: 7,
        latestNonce: 7,
        pendingNonce: 8,
        phase: "creator_fee_flush",
      }),
    /pending while latest is 7/,
  );
});

test("manual nonce guard rejects a stale operator nonce", () => {
  assert.throws(
    () =>
      assertManualNonceState({
        expectedNonce: 7,
        latestNonce: 8,
        pendingNonce: 8,
        phase: "buyback",
      }),
    /expected signer nonce 7, but the chain reports 8/,
  );
});
