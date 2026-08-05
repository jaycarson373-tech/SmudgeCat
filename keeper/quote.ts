import { getAddress, isAddress, isHex, type Address, type Hex } from "viem";

export interface QuoteRequest {
  chainId: number;
  vault: Address;
  router: Address;
  wrappedNativeToken: Address;
  inputToken: Address;
  outputToken: Address;
  recipient: Address;
  amountIn: bigint;
  maximumSlippageBps: number;
}

export interface ValidatedQuote {
  quoteId?: string;
  quotedOutput: bigint;
  priceImpactBps: number;
  routerData: Hex;
  expiresAt: number;
}

interface QuoteEnvelope {
  quoteId?: unknown;
  chainId?: unknown;
  router?: unknown;
  wrappedNativeToken?: unknown;
  inputToken?: unknown;
  outputToken?: unknown;
  recipient?: unknown;
  amountIn?: unknown;
  maximumSlippageBps?: unknown;
  quotedOutput?: unknown;
  priceImpactBps?: unknown;
  routerData?: unknown;
  expiresAt?: unknown;
}

export class QuoteServiceError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
    this.name = "QuoteServiceError";
  }
}

function parseUnsignedBigInt(value: unknown, field: string, allowZero = false): bigint {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new QuoteServiceError(`${field} must be an unsigned base-10 string`);
  }
  const parsed = BigInt(value);
  if (allowZero ? parsed < 0n : parsed <= 0n) {
    throw new QuoteServiceError(`${field} must be ${allowZero ? "non-negative" : "positive"}`);
  }
  return parsed;
}

function parseEchoedAddress(value: unknown, field: string, expected: Address): void {
  if (typeof value !== "string" || !isAddress(value, { strict: false })) {
    throw new QuoteServiceError(`${field} is missing or invalid`);
  }
  if (getAddress(value) !== getAddress(expected)) {
    throw new QuoteServiceError(`${field} does not match the keeper request`);
  }
}

export async function requestDexQuote(options: {
  apiUrl: string;
  apiKey?: string;
  timeoutMs: number;
  request: QuoteRequest;
}): Promise<ValidatedQuote> {
  const { request } = options;
  let response: Response;

  try {
    response = await fetch(options.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
      },
      body: JSON.stringify({
        chainId: request.chainId,
        vault: request.vault,
        router: request.router,
        wrappedNativeToken: request.wrappedNativeToken,
        inputToken: request.inputToken,
        outputToken: request.outputToken,
        recipient: request.recipient,
        amountIn: request.amountIn.toString(),
        maximumSlippageBps: request.maximumSlippageBps,
      }),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    throw new QuoteServiceError(
      `Quote request failed: ${error instanceof Error ? error.message : String(error)}`,
      true,
    );
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new QuoteServiceError(`Quote service returned HTTP ${response.status}`, retryable);
  }

  let data: QuoteEnvelope;
  try {
    data = (await response.json()) as QuoteEnvelope;
  } catch {
    throw new QuoteServiceError("Quote service returned invalid JSON");
  }

  if (data.chainId !== request.chainId) {
    throw new QuoteServiceError("chainId does not match the keeper request");
  }
  parseEchoedAddress(data.router, "router", request.router);
  parseEchoedAddress(
    data.wrappedNativeToken,
    "wrappedNativeToken",
    request.wrappedNativeToken,
  );
  parseEchoedAddress(data.inputToken, "inputToken", request.inputToken);
  parseEchoedAddress(data.outputToken, "outputToken", request.outputToken);
  parseEchoedAddress(data.recipient, "recipient", request.recipient);

  const echoedAmount = parseUnsignedBigInt(data.amountIn, "amountIn");
  if (echoedAmount !== request.amountIn) {
    throw new QuoteServiceError("amountIn does not match the keeper request");
  }
  if (data.maximumSlippageBps !== request.maximumSlippageBps) {
    throw new QuoteServiceError("maximumSlippageBps does not match the keeper request");
  }

  const quotedOutput = parseUnsignedBigInt(data.quotedOutput, "quotedOutput");
  if (
    typeof data.priceImpactBps !== "number" ||
    !Number.isSafeInteger(data.priceImpactBps) ||
    data.priceImpactBps < 0 ||
    data.priceImpactBps >= 10_000
  ) {
    throw new QuoteServiceError("priceImpactBps must be an integer from 0 through 9999");
  }
  if (
    typeof data.routerData !== "string" ||
    !isHex(data.routerData) ||
    data.routerData.length % 2 !== 0
  ) {
    throw new QuoteServiceError("routerData must be valid 0x-prefixed adapter route data");
  }
  if (
    typeof data.expiresAt !== "number" ||
    !Number.isSafeInteger(data.expiresAt) ||
    data.expiresAt <= 0
  ) {
    throw new QuoteServiceError("expiresAt must be a Unix timestamp in seconds");
  }
  if (data.quoteId !== undefined && typeof data.quoteId !== "string") {
    throw new QuoteServiceError("quoteId must be a string when provided");
  }

  return {
    quoteId: data.quoteId,
    quotedOutput,
    priceImpactBps: data.priceImpactBps,
    routerData: data.routerData,
    expiresAt: data.expiresAt,
  };
}
