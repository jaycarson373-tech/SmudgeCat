import { isAddress, type Address, type Hex } from "viem";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

export interface KeeperConfig {
  chainId: number;
  rpcUrl: string;
  vaultAddress: Address;
  privateKey?: Hex;
  keeperAddress?: Address;
  expectedZazuToken: Address;
  expectedDexRouter: Address;
  expectedWrappedNative: Address;
  expectedDestination: Address;
  expectedFeeToken: Address;
  expectedMinimumAmount: bigint;
  expectedMaximumAmount: bigint;
  expectedMaximumSlippageBps: bigint;
  quoteApiUrl: string;
  quoteApiKey?: string;
  quoteTimeoutMs: number;
  quoteValidityBufferSeconds: number;
  maximumPriceImpactBps: number;
  maximumGasUnits: bigint;
  maximumGasCostWei: bigint;
  pollIntervalMs: number;
  confirmations: number;
  receiptTimeoutMs: number;
  rpcRetryAttempts: number;
  rpcRetryBaseDelayMs: number;
  rpcRetryMaximumDelayMs: number;
  lockFile: string;
  lockStaleMs: number;
  logFile?: string;
  dryRun: boolean;
  runOnce: boolean;
}

const readRequired = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};

const readOptional = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

const readBoolean = (name: string, defaultValue = false): boolean => {
  const value = readOptional(name);
  if (value === undefined) return defaultValue;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`${name} must be true, false, 1, or 0`);
};

const readInteger = (
  name: string,
  options: { defaultValue?: number; minimum?: number; maximum?: number } = {},
): number => {
  const raw = readOptional(name);
  const value = raw === undefined ? options.defaultValue : Number(raw);
  if (value === undefined || !Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a safe integer`);
  }
  if (options.minimum !== undefined && value < options.minimum) {
    throw new Error(`${name} must be at least ${options.minimum}`);
  }
  if (options.maximum !== undefined && value > options.maximum) {
    throw new Error(`${name} must be at most ${options.maximum}`);
  }
  return value;
};

const readBigInt = (name: string, allowZero = false): bigint => {
  const raw = readRequired(name);
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an unsigned integer in base units`);
  }
  const value = BigInt(raw);
  if (allowZero ? value < 0n : value <= 0n) {
    throw new Error(`${name} must be ${allowZero ? "non-negative" : "positive"}`);
  }
  return value;
};

const readAddress = (name: string, required = true): Address | undefined => {
  const value = required ? readRequired(name) : readOptional(name);
  if (value === undefined) return undefined;
  if (!isAddress(value, { strict: false })) {
    throw new Error(`${name} must be a valid EVM address`);
  }
  return value as Address;
};

const readPrivateKey = (required: boolean): Hex | undefined => {
  const value = required
    ? readRequired("KEEPER_PRIVATE_KEY")
    : readOptional("KEEPER_PRIVATE_KEY");
  if (value === undefined) return undefined;
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("KEEPER_PRIVATE_KEY must be a 32-byte 0x-prefixed private key");
  }
  return value as Hex;
};

const readHttpUrl = (name: string, allowLocalHttp = false): string => {
  const raw = readRequired(name);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(allowLocalHttp && local)) {
    throw new Error(`${name} must use HTTPS${allowLocalHttp ? " (HTTP is allowed only for localhost)" : ""}`);
  }
  return parsed.toString();
};

export function loadKeeperConfig(): KeeperConfig {
  const dryRun = readBoolean("KEEPER_DRY_RUN", false);
  const privateKey = readPrivateKey(!dryRun);
  const keeperAddress = privateKey
    ? undefined
    : readAddress("KEEPER_ADDRESS", true);

  const expectedMinimumAmount = readBigInt("MIN_EXECUTION_AMOUNT");
  const expectedMaximumAmount = readBigInt("MAX_EXECUTION_AMOUNT");
  if (expectedMaximumAmount < expectedMinimumAmount) {
    throw new Error("MAX_EXECUTION_AMOUNT must be greater than or equal to MIN_EXECUTION_AMOUNT");
  }

  const expectedMaximumSlippageBps = readBigInt("MAX_SLIPPAGE_BPS");
  if (expectedMaximumSlippageBps > 500n) {
    throw new Error("MAX_SLIPPAGE_BPS must be between 1 and the vault hard cap of 500");
  }

  const chainId = readInteger("CHAIN_ID", { minimum: 1 });
  const vaultAddress = readAddress("BUYBACK_VAULT_ADDRESS", true)!;
  const defaultLockFile = resolve(
    tmpdir(),
    `zazu-keeper-${chainId}-${vaultAddress.toLowerCase()}.lock`,
  );

  return {
    chainId,
    rpcUrl: readHttpUrl("ROBINHOOD_RPC_URL", true),
    vaultAddress,
    privateKey,
    keeperAddress,
    expectedZazuToken: readAddress("ZAZU_TOKEN_ADDRESS", true)!,
    expectedDexRouter: readAddress("DEX_ROUTER_ADDRESS", true)!,
    expectedWrappedNative: readAddress("WRAPPED_NATIVE_ADDRESS", true)!,
    expectedDestination: readAddress("BUYBACK_DESTINATION", true)!,
    expectedFeeToken: readAddress("FEE_TOKEN_ADDRESS", true)!,
    expectedMinimumAmount,
    expectedMaximumAmount,
    expectedMaximumSlippageBps,
    quoteApiUrl: readHttpUrl("KEEPER_QUOTE_API_URL", true),
    quoteApiKey: readOptional("KEEPER_QUOTE_API_KEY"),
    quoteTimeoutMs: readInteger("KEEPER_QUOTE_TIMEOUT_MS", {
      defaultValue: 10_000,
      minimum: 1_000,
      maximum: 60_000,
    }),
    quoteValidityBufferSeconds: readInteger("KEEPER_QUOTE_VALIDITY_BUFFER_SECONDS", {
      defaultValue: 30,
      minimum: 1,
      maximum: 300,
    }),
    maximumPriceImpactBps: readInteger("KEEPER_MAX_PRICE_IMPACT_BPS", {
      minimum: 0,
      maximum: 9_999,
    }),
    maximumGasUnits: readBigInt("KEEPER_MAX_GAS_UNITS"),
    maximumGasCostWei: readBigInt("KEEPER_MAX_GAS_COST_WEI"),
    pollIntervalMs: readInteger("KEEPER_POLL_INTERVAL_MS", {
      defaultValue: 60_000,
      minimum: 60_000,
      maximum: 60_000,
    }),
    confirmations: readInteger("KEEPER_CONFIRMATIONS", {
      defaultValue: 2,
      minimum: 1,
      maximum: 64,
    }),
    receiptTimeoutMs: readInteger("KEEPER_RECEIPT_TIMEOUT_MS", {
      defaultValue: 180_000,
      minimum: 10_000,
      maximum: 1_800_000,
    }),
    rpcRetryAttempts: readInteger("KEEPER_RPC_RETRY_ATTEMPTS", {
      defaultValue: 5,
      minimum: 1,
      maximum: 10,
    }),
    rpcRetryBaseDelayMs: readInteger("KEEPER_RPC_RETRY_BASE_DELAY_MS", {
      defaultValue: 1_000,
      minimum: 100,
      maximum: 30_000,
    }),
    rpcRetryMaximumDelayMs: readInteger("KEEPER_RPC_RETRY_MAX_DELAY_MS", {
      defaultValue: 30_000,
      minimum: 1_000,
      maximum: 120_000,
    }),
    lockFile: resolve(readOptional("KEEPER_LOCK_FILE") ?? defaultLockFile),
    lockStaleMs: readInteger("KEEPER_LOCK_STALE_MS", {
      defaultValue: 180_000,
      minimum: 120_000,
      maximum: 86_400_000,
    }),
    logFile: readOptional("KEEPER_LOG_FILE")
      ? resolve(readOptional("KEEPER_LOG_FILE")!)
      : undefined,
    dryRun,
    runOnce: readBoolean("KEEPER_RUN_ONCE", false),
  };
}
