export interface ManualNonceState {
  expectedNonce: number;
  latestNonce: number;
  pendingNonce: number;
  phase: "creator_fee_flush" | "buyback";
}

export function assertManualNonceState(state: ManualNonceState): void {
  if (state.latestNonce !== state.pendingNonce) {
    throw new Error(
      `Manual ${state.phase} blocked because signer nonce ${state.pendingNonce} is pending while latest is ${state.latestNonce}. Reconcile pending transactions first.`,
    );
  }
  if (state.latestNonce !== state.expectedNonce) {
    throw new Error(
      `Manual ${state.phase} expected signer nonce ${state.expectedNonce}, but the chain reports ${state.latestNonce}. Re-read the nonce and restart with an explicit acknowledgement.`,
    );
  }
}
