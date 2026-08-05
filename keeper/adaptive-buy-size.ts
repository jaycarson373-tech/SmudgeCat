export const DEFAULT_MAX_BUY_SIZE_ATTEMPTS = 8;

export interface PriceImpactQuote {
  priceImpactBps: number;
}

export interface BuySizeAttempt<TQuote extends PriceImpactQuote> {
  amountIn: bigint;
  quote: TQuote;
  safe: boolean;
}

export type AdaptiveBuySizeResult<TQuote extends PriceImpactQuote> =
  | {
      safe: true;
      amountIn: bigint;
      quote: TQuote;
      attempts: readonly BuySizeAttempt<TQuote>[];
    }
  | {
      safe: false;
      attempts: readonly BuySizeAttempt<TQuote>[];
    };

export interface AdaptiveBuySizeOptions<TQuote extends PriceImpactQuote> {
  requestedAmountIn: bigint;
  minimumAmountIn: bigint;
  maximumPriceImpactBps: number;
  getQuote: (amountIn: bigint) => Promise<TQuote>;
  maxAttempts?: number;
}

function assertValidOptions<TQuote extends PriceImpactQuote>(
  options: AdaptiveBuySizeOptions<TQuote>,
  maxAttempts: number,
): void {
  if (options.requestedAmountIn <= 0n) {
    throw new RangeError("requestedAmountIn must be positive");
  }
  if (options.minimumAmountIn <= 0n) {
    throw new RangeError("minimumAmountIn must be positive");
  }
  if (options.requestedAmountIn < options.minimumAmountIn) {
    throw new RangeError("requestedAmountIn must be greater than or equal to minimumAmountIn");
  }
  if (
    !Number.isSafeInteger(options.maximumPriceImpactBps) ||
    options.maximumPriceImpactBps < 0 ||
    options.maximumPriceImpactBps >= 10_000
  ) {
    throw new RangeError("maximumPriceImpactBps must be an integer from 0 through 9999");
  }
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive safe integer");
  }
  if (options.requestedAmountIn > options.minimumAmountIn && maxAttempts < 2) {
    throw new RangeError(
      "maxAttempts must be at least 2 when requestedAmountIn exceeds minimumAmountIn",
    );
  }
}

function assertValidQuote(quote: PriceImpactQuote): void {
  if (
    !Number.isSafeInteger(quote.priceImpactBps) ||
    quote.priceImpactBps < 0 ||
    quote.priceImpactBps >= 10_000
  ) {
    throw new RangeError("quote priceImpactBps must be an integer from 0 through 9999");
  }
}

/**
 * Finds the largest quoted candidate encountered while halving toward the configured minimum.
 * The last available attempt is reserved for the exact minimum, so an unsafe result always
 * includes a quote at the minimum amount. Quote transport/provider failures are intentionally
 * allowed to bubble to the keeper's existing retry and backoff path.
 */
export async function selectAdaptiveBuySize<TQuote extends PriceImpactQuote>(
  options: AdaptiveBuySizeOptions<TQuote>,
): Promise<AdaptiveBuySizeResult<TQuote>> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_BUY_SIZE_ATTEMPTS;
  assertValidOptions(options, maxAttempts);

  const attempts: BuySizeAttempt<TQuote>[] = [];
  let candidate = options.requestedAmountIn;

  while (attempts.length < maxAttempts) {
    const quote = await options.getQuote(candidate);
    assertValidQuote(quote);

    const safe = quote.priceImpactBps <= options.maximumPriceImpactBps;
    attempts.push({ amountIn: candidate, quote, safe });

    if (safe) {
      return { safe: true, amountIn: candidate, quote, attempts };
    }
    if (candidate === options.minimumAmountIn) {
      return { safe: false, attempts };
    }

    const attemptsRemaining = maxAttempts - attempts.length;
    if (attemptsRemaining === 1) {
      candidate = options.minimumAmountIn;
      continue;
    }

    const halved = candidate / 2n;
    candidate = halved > options.minimumAmountIn ? halved : options.minimumAmountIn;
  }

  // Option validation and the reserved final slot make this branch unreachable.
  return { safe: false, attempts };
}
