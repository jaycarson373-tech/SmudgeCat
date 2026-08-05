import assert from "node:assert/strict";
import test from "node:test";
import {
  liveAcknowledgement,
  loadTuffV2TestConfig,
  quoteCurveBuy,
  TUFF_V2_TEST,
} from "./tuff-v2-test-config";

const environment = {
  ROBINHOOD_RPC_URL: "https://rpc.mainnet.chain.robinhood.com",
  CHAIN_ID: "4663",
  TUFF_TOKEN_ADDRESS: TUFF_V2_TEST.token,
  TUFF_CURVE_ADDRESS: TUFF_V2_TEST.curve,
  PONS_V2_FACTORY_ADDRESS: TUFF_V2_TEST.factory,
  PONS_V2_FEE_ESCROW_ADDRESS: TUFF_V2_TEST.feeEscrow,
  TUFF_TEST_SIGNER_ADDRESS: TUFF_V2_TEST.creator,
  BUYBACK_DESTINATION: TUFF_V2_TEST.burnDestination,
  TUFF_TEST_BUY_AMOUNT_WEI: TUFF_V2_TEST.buyAmountWei.toString(),
  TUFF_TEST_MAX_SLIPPAGE_BPS: TUFF_V2_TEST.maximumSlippageBps.toString(),
  TUFF_TEST_MAX_GAS_LIMIT: TUFF_V2_TEST.maximumGasLimit.toString(),
  TUFF_TEST_MAX_FEE_PER_GAS_WEI: TUFF_V2_TEST.maximumFeePerGasWei.toString(),
  TUFF_TEST_CONFIRMATIONS: "2",
  TUFF_TEST_DRY_RUN: "true",
};

test("loads dry-run config without a private key", () => {
  const config = loadTuffV2TestConfig(environment);
  assert.equal(config.dryRun, true);
  assert.equal(config.privateKey, undefined);
  assert.equal(config.expectedNonce, undefined);
});

test("rejects any buy amount other than exactly 0.0005 ETH", () => {
  assert.throws(
    () =>
      loadTuffV2TestConfig({
        ...environment,
        TUFF_TEST_BUY_AMOUNT_WEI: "500000000000001",
      }),
    /must equal 500000000000000/,
  );
});

test("requires the exact live acknowledgement before reading the key", () => {
  assert.throws(
    () =>
      loadTuffV2TestConfig({
        ...environment,
        TUFF_TEST_DRY_RUN: "false",
        TUFF_TEST_EXPECTED_NONCE: "26",
        TUFF_TEST_ACK: "wrong",
      }),
    /TUFF_TEST_ACK must equal/,
  );
  assert.match(liveAcknowledgement(26), /500000000000000/);
  assert.match(liveAcknowledgement(26), /:26$/);
});

test("matches the verified TUFF curve quote", () => {
  const quote = quoteCurveBuy({
    quoteIn: TUFF_V2_TEST.buyAmountWei,
    quoteReserve: 1_680_000_000_000_127_770n,
    tokenReserve: 999_999_999_999_923_947_559_625_342n,
    sellableTokens: 714_285_714_285_638_233_273_911_057n,
    feeBps: 100n,
    creatorTaxBps: 200n,
    snipeTaxBps: 0n,
  });
  assert.equal(quote.fee, 5_000_000_000_000n);
  assert.equal(quote.tax, 10_000_000_000_000n);
  assert.equal(quote.netQuote, 485_000_000_000_000n);
  assert.equal(quote.tokensOut, 288_607_158_052_542_116_847_120n);
  assert.equal(quote.refund, 0n);
});
