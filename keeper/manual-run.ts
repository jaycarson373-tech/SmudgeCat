import { getAddress, isAddress, type Address } from "viem";

export type KeeperEnvironment = Record<string, string | undefined>;

export interface ManualRunGuard {
  chainId: number;
  dryRun: boolean;
  vaultAddress: Address;
  expectedNonce?: number;
  manualReason?: string;
}

function parseBoolean(name: string, value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  throw new Error(`${name} must be true, false, 1, or 0`);
}

function requiredVaultAddress(environment: KeeperEnvironment): Address {
  const value = environment.BUYBACK_VAULT_ADDRESS?.trim();
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error("BUYBACK_VAULT_ADDRESS must be set to the deployed vault before a manual run");
  }
  return getAddress(value);
}

function requiredChainId(environment: KeeperEnvironment): number {
  const raw = environment.CHAIN_ID?.trim();
  const value = raw ? Number(raw) : Number.NaN;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("CHAIN_ID must be a positive integer before a manual run");
  }
  return value;
}

function requiredExpectedNonce(environment: KeeperEnvironment): number {
  const raw = environment.KEEPER_MANUAL_EXPECTED_NONCE?.trim();
  if (!raw || !/^\d+$/.test(raw)) {
    throw new Error("Live manual execution requires KEEPER_MANUAL_EXPECTED_NONCE");
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new Error("KEEPER_MANUAL_EXPECTED_NONCE must be a safe non-negative integer");
  }
  return value;
}

export function manualAcknowledgement(chainId: number, vaultAddress: Address): string {
  return `AUTOMATION_STOPPED:${chainId}:${getAddress(vaultAddress)}`;
}

export function assertManualRunEnvironment(
  environment: KeeperEnvironment,
): ManualRunGuard {
  if (!parseBoolean("KEEPER_MANUAL_RUN", environment.KEEPER_MANUAL_RUN, false)) {
    throw new Error("KEEPER_MANUAL_RUN must be true for the manual keeper entrypoint");
  }
  if (!parseBoolean("KEEPER_RUN_ONCE", environment.KEEPER_RUN_ONCE, false)) {
    throw new Error("Manual keeper mode requires KEEPER_RUN_ONCE=true");
  }

  const chainId = requiredChainId(environment);
  const vaultAddress = requiredVaultAddress(environment);
  const dryRun = parseBoolean("KEEPER_DRY_RUN", environment.KEEPER_DRY_RUN, true);
  const manualReason = environment.KEEPER_MANUAL_REASON?.trim();
  let expectedNonce: number | undefined;

  if (!dryRun) {
    const expectedAcknowledgement = manualAcknowledgement(chainId, vaultAddress);
    const acknowledgement = environment.KEEPER_MANUAL_ACK?.trim();
    if (acknowledgement?.toLowerCase() !== expectedAcknowledgement.toLowerCase()) {
      throw new Error(
        `Live manual execution requires KEEPER_MANUAL_ACK=${expectedAcknowledgement}`,
      );
    }
    if (!manualReason || manualReason.length < 8 || manualReason.length > 200) {
      throw new Error(
        "Live manual execution requires KEEPER_MANUAL_REASON between 8 and 200 characters",
      );
    }
    expectedNonce = requiredExpectedNonce(environment);
  }

  return { chainId, dryRun, vaultAddress, expectedNonce, manualReason };
}

export function prepareManualRunEnvironment(
  environment: KeeperEnvironment,
): ManualRunGuard {
  environment.KEEPER_RUN_ONCE = "true";
  environment.KEEPER_MANUAL_RUN = "true";
  environment.KEEPER_DRY_RUN ??= "true";
  return assertManualRunEnvironment(environment);
}
