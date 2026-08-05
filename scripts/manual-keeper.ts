import { prepareManualRunEnvironment } from "../keeper/manual-run";

const guard = prepareManualRunEnvironment(process.env);

console.log(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    event: "manual_guard_armed",
    mode: guard.dryRun ? "dry-run" : "live",
    chainId: guard.chainId,
    vault: guard.vaultAddress,
    expectedNonce: guard.expectedNonce,
    manualReason: guard.manualReason,
  }),
);

await import("./keeper");
