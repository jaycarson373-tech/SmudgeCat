import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MAX_BUY_SIZE_ATTEMPTS,
  selectAdaptiveBuySize,
  type PriceImpactQuote,
} from "./adaptive-buy-size";

interface TestQuote extends PriceImpactQuote {
  marker: string;
}

const quoteWithImpact = (priceImpactBps: number) => async (amountIn: bigint): Promise<TestQuote> => ({
  priceImpactBps,
  marker: amountIn.toString(),
});

test("accepts the requested amount when its first quote is safe", async () => {
  const quotedAmounts: bigint[] = [];
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 100n,
    minimumAmountIn: 10n,
    maximumPriceImpactBps: 100,
    getQuote: async (amountIn) => {
      quotedAmounts.push(amountIn);
      return { priceImpactBps: 100, marker: "requested" };
    },
  });

  assert.equal(result.safe, true);
  if (!result.safe) assert.fail("expected a safe result");
  assert.equal(result.amountIn, 100n);
  assert.equal(result.quote.marker, "requested");
  assert.deepEqual(quotedAmounts, [100n]);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0]?.safe, true);
});

test("halves unsafe candidates and returns the first safe quote", async () => {
  const quotedAmounts: bigint[] = [];
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 100n,
    minimumAmountIn: 10n,
    maximumPriceImpactBps: 200,
    getQuote: async (amountIn) => {
      quotedAmounts.push(amountIn);
      return {
        priceImpactBps: amountIn > 25n ? 201 : 150,
        marker: amountIn.toString(),
      };
    },
  });

  assert.equal(result.safe, true);
  if (!result.safe) assert.fail("expected a safe result");
  assert.equal(result.amountIn, 25n);
  assert.deepEqual(quotedAmounts, [100n, 50n, 25n]);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.safe),
    [false, false, true],
  );
});

test("clamps a halved candidate to the exact configured minimum", async () => {
  const quotedAmounts: bigint[] = [];
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 100n,
    minimumAmountIn: 30n,
    maximumPriceImpactBps: 100,
    getQuote: async (amountIn) => {
      quotedAmounts.push(amountIn);
      return {
        priceImpactBps: amountIn === 30n ? 100 : 101,
        marker: amountIn.toString(),
      };
    },
  });

  assert.equal(result.safe, true);
  if (!result.safe) assert.fail("expected the minimum to be safe");
  assert.equal(result.amountIn, 30n);
  assert.deepEqual(quotedAmounts, [100n, 50n, 30n]);
});

test("reserves the capped final attempt for the minimum", async () => {
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 1_024n,
    minimumAmountIn: 1n,
    maximumPriceImpactBps: 100,
    maxAttempts: 3,
    getQuote: quoteWithImpact(101),
  });

  assert.equal(result.safe, false);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.amountIn),
    [1_024n, 512n, 1n],
  );
});

test("can return safe from the reserved minimum attempt", async () => {
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 1_024n,
    minimumAmountIn: 1n,
    maximumPriceImpactBps: 100,
    maxAttempts: 3,
    getQuote: async (amountIn) => ({
      priceImpactBps: amountIn === 1n ? 99 : 101,
      marker: amountIn.toString(),
    }),
  });

  assert.equal(result.safe, true);
  if (!result.safe) assert.fail("expected the minimum to be safe");
  assert.equal(result.amountIn, 1n);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.amountIn),
    [1_024n, 512n, 1n],
  );
});

test("default cap is eight attempts and the eighth is the minimum", async () => {
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 1_048_576n,
    minimumAmountIn: 1n,
    maximumPriceImpactBps: 10,
    getQuote: quoteWithImpact(11),
  });

  assert.equal(result.safe, false);
  assert.equal(result.attempts.length, DEFAULT_MAX_BUY_SIZE_ATTEMPTS);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.amountIn),
    [1_048_576n, 524_288n, 262_144n, 131_072n, 65_536n, 32_768n, 16_384n, 1n],
  );
});

test("quotes the minimum only once when it is also the requested amount", async () => {
  const result = await selectAdaptiveBuySize({
    requestedAmountIn: 10n,
    minimumAmountIn: 10n,
    maximumPriceImpactBps: 10,
    maxAttempts: 1,
    getQuote: quoteWithImpact(11),
  });

  assert.equal(result.safe, false);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.amountIn),
    [10n],
  );
});

test("propagates quote failures without blindly trying a smaller amount", async () => {
  const quotedAmounts: bigint[] = [];
  await assert.rejects(
    selectAdaptiveBuySize({
      requestedAmountIn: 100n,
      minimumAmountIn: 10n,
      maximumPriceImpactBps: 100,
      getQuote: async (amountIn) => {
        quotedAmounts.push(amountIn);
        throw new Error("quote provider unavailable");
      },
    }),
    /quote provider unavailable/,
  );
  assert.deepEqual(quotedAmounts, [100n]);
});

test("rejects invalid amount, impact, attempt, and quote inputs", async () => {
  const valid = {
    requestedAmountIn: 100n,
    minimumAmountIn: 10n,
    maximumPriceImpactBps: 100,
    getQuote: quoteWithImpact(100),
  };

  await assert.rejects(
    selectAdaptiveBuySize({ ...valid, requestedAmountIn: 0n }),
    /requestedAmountIn must be positive/,
  );
  await assert.rejects(
    selectAdaptiveBuySize({ ...valid, minimumAmountIn: 0n }),
    /minimumAmountIn must be positive/,
  );
  await assert.rejects(
    selectAdaptiveBuySize({ ...valid, requestedAmountIn: 9n }),
    /greater than or equal/,
  );
  await assert.rejects(
    selectAdaptiveBuySize({ ...valid, maximumPriceImpactBps: 10_000 }),
    /maximumPriceImpactBps/,
  );
  await assert.rejects(
    selectAdaptiveBuySize({ ...valid, maxAttempts: 1 }),
    /maxAttempts must be at least 2/,
  );
  await assert.rejects(
    selectAdaptiveBuySize({ ...valid, getQuote: quoteWithImpact(Number.NaN) }),
    /quote priceImpactBps/,
  );
});
