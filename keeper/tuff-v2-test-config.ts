import { getAddress, isAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const TUFF_V2_TEST = {
  chainId: 4663,
  creator: getAddress("0xCAfE59cb5466321617108a8838ed7d4F562Cc5c8"),
  token: getAddress("0x9899CED1B23834d511e5f2998Fa1F7D5dB563668"),
  curve: getAddress("0x36FC810b7F267d1B27beAAeFD61fC2a2073D44C7"),
  factory: getAddress("0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e"),
  feeEscrow: getAddress("0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e"),
  burnDestination: getAddress("0x000000000000000000000000000000000000dEaD"),
  buyAmountWei: 500_000_000_000_000n,
  maximumSlippageBps: 100n,
  maximumGasLimit: 500_000n,
  maximumFeePerGasWei: 100_000_000n,
  minimumPostClaimReserveWei: 100_000_000_000_000n,
} as const;

export interface TuffV2TestConfig {
  rpcUrl: string;
  dryRun: boolean;
  confirmations: number;
  expectedNonce?: number;
  privateKey?: Hex;
}

export interface CurveBuyQuote {
  fee: bigint;
  tax: bigint;
  snipeTax: bigint;
  netQuote: bigint;
  tokensOut: bigint;
  spent: bigint;
  refund: bigint;
}

type Environment = Record<string, string | undefined>;

function required(environment: Environment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

function requireAddressPin(
  environment: Environment,
  name: string,
  expected: Address,
): void {
  const value = required(environment, name);
  if (!isAddress(value, { strict: false }) || getAddress(value) !== expected) {
    throw new Error(`${name} must equal ${expected}`);
  }
}

function readBoolean(environment: Environment, name: string): boolean {
  const value = required(environment, name);
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`${name} must be true, false, 1, or 0`);
}

export function liveAcknowledgement(expectedNonce: number): string {
  return [
    "TUFF_BUY_AND_BURN",
    TUFF_V2_TEST.chainId,
    TUFF_V2_TEST.creator,
    TUFF_V2_TEST.token,
    TUFF_V2_TEST.curve,
    TUFF_V2_TEST.buyAmountWei,
    TUFF_V2_TEST.burnDestination,
    expectedNonce,
  ].join(":");
}

export function loadTuffV2TestConfig(
  environment: Environment = process.env,
): TuffV2TestConfig {
  const rawRpcUrl = required(environment, "ROBINHOOD_RPC_URL");
  let rpcUrl: URL;
  try {
    rpcUrl = new URL(rawRpcUrl);
  } catch {
    throw new Error("ROBINHOOD_RPC_URL must be a valid URL");
  }
  if (rpcUrl.protocol !== "https:") {
    throw new Error("ROBINHOOD_RPC_URL must use HTTPS");
  }
  if (required(environment, "CHAIN_ID") !== String(TUFF_V2_TEST.chainId)) {
    throw new Error(`CHAIN_ID must equal ${TUFF_V2_TEST.chainId}`);
  }

  requireAddressPin(environment, "TUFF_TOKEN_ADDRESS", TUFF_V2_TEST.token);
  requireAddressPin(environment, "TUFF_CURVE_ADDRESS", TUFF_V2_TEST.curve);
  requireAddressPin(environment, "PONS_V2_FACTORY_ADDRESS", TUFF_V2_TEST.factory);
  requireAddressPin(
    environment,
    "PONS_V2_FEE_ESCROW_ADDRESS",
    TUFF_V2_TEST.feeEscrow,
  );
  requireAddressPin(
    environment,
    "TUFF_TEST_SIGNER_ADDRESS",
    TUFF_V2_TEST.creator,
  );
  requireAddressPin(
    environment,
    "BUYBACK_DESTINATION",
    TUFF_V2_TEST.burnDestination,
  );

  const exactPins: Array<[string, bigint]> = [
    ["TUFF_TEST_BUY_AMOUNT_WEI", TUFF_V2_TEST.buyAmountWei],
    ["TUFF_TEST_MAX_SLIPPAGE_BPS", TUFF_V2_TEST.maximumSlippageBps],
    ["TUFF_TEST_MAX_GAS_LIMIT", TUFF_V2_TEST.maximumGasLimit],
    ["TUFF_TEST_MAX_FEE_PER_GAS_WEI", TUFF_V2_TEST.maximumFeePerGasWei],
  ];
  for (const [name, expected] of exactPins) {
    if (required(environment, name) !== expected.toString()) {
      throw new Error(`${name} must equal ${expected}`);
    }
  }

  const confirmationsRaw = environment.TUFF_TEST_CONFIRMATIONS?.trim() || "2";
  const confirmations = Number(confirmationsRaw);
  if (!Number.isSafeInteger(confirmations) || confirmations < 1 || confirmations > 16) {
    throw new Error("TUFF_TEST_CONFIRMATIONS must be an integer from 1 through 16");
  }
  const dryRun = readBoolean(environment, "TUFF_TEST_DRY_RUN");
  if (dryRun) {
    return { rpcUrl: rpcUrl.toString(), dryRun, confirmations };
  }

  const nonceRaw = required(environment, "TUFF_TEST_EXPECTED_NONCE");
  if (!/^\d+$/.test(nonceRaw)) {
    throw new Error("TUFF_TEST_EXPECTED_NONCE must be a non-negative integer");
  }
  const expectedNonce = Number(nonceRaw);
  if (!Number.isSafeInteger(expectedNonce)) {
    throw new Error("TUFF_TEST_EXPECTED_NONCE must be a safe integer");
  }
  if (
    required(environment, "TUFF_TEST_ACK") !==
    liveAcknowledgement(expectedNonce)
  ) {
    throw new Error(
      `TUFF_TEST_ACK must equal ${liveAcknowledgement(expectedNonce)}`,
    );
  }
  const privateKey = required(environment, "TUFF_TEST_PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("TUFF_TEST_PRIVATE_KEY must be a 32-byte 0x-prefixed key");
  }
  if (privateKeyToAccount(privateKey as Hex).address !== TUFF_V2_TEST.creator) {
    throw new Error(`TUFF_TEST_PRIVATE_KEY must derive ${TUFF_V2_TEST.creator}`);
  }

  return {
    rpcUrl: rpcUrl.toString(),
    dryRun,
    confirmations,
    expectedNonce,
    privateKey: privateKey as Hex,
  };
}

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export function quoteCurveBuy(input: {
  quoteIn: bigint;
  quoteReserve: bigint;
  tokenReserve: bigint;
  sellableTokens: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
  snipeTaxBps: bigint;
}): CurveBuyQuote {
  const bps = 10_000n;
  if (
    input.quoteIn <= 0n ||
    input.quoteReserve <= 0n ||
    input.tokenReserve <= 0n ||
    input.sellableTokens <= 0n
  ) {
    throw new Error("Curve quote inputs must be positive");
  }
  if (input.feeBps + input.creatorTaxBps >= bps) {
    throw new Error("Curve fees are invalid");
  }

  let snipeTaxBps = input.snipeTaxBps;
  if (snipeTaxBps > 0n) {
    const maximum = bps - input.feeBps - input.creatorTaxBps - 100n;
    if (snipeTaxBps > maximum) snipeTaxBps = maximum;
  }
  let spent = input.quoteIn;
  let fee = (spent * input.feeBps) / bps;
  let tax = (spent * input.creatorTaxBps) / bps;
  let snipeTax = (spent * snipeTaxBps) / bps;
  let netQuote = spent - fee - tax - snipeTax;
  let tokensOut =
    (netQuote * input.tokenReserve) / (input.quoteReserve + netQuote);

  if (tokensOut > input.sellableTokens) {
    tokensOut = input.sellableTokens;
    netQuote = ceilDiv(
      input.sellableTokens * input.quoteReserve,
      input.tokenReserve - input.sellableTokens,
    );
    const grossed = ceilDiv(
      netQuote * bps,
      bps - input.feeBps - input.creatorTaxBps - snipeTaxBps,
    );
    spent = grossed < input.quoteIn ? grossed : input.quoteIn;
    fee = (spent * input.feeBps) / bps;
    tax = (spent * input.creatorTaxBps) / bps;
    snipeTax = (spent * snipeTaxBps) / bps;
    netQuote = spent - fee - tax - snipeTax;
  }
  if (tokensOut <= 0n) throw new Error("Curve quote returned zero tokens");
  return {
    fee,
    tax,
    snipeTax,
    netQuote,
    tokensOut,
    spent,
    refund: input.quoteIn - spent,
  };
}
