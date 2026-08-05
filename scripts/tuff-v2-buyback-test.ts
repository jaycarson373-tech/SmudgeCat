import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  decodeFunctionResult,
  defineChain,
  encodeFunctionData,
  formatEther,
  formatUnits,
  getAddress,
  http,
  parseAbi,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describeError, KeeperLogger } from "../keeper/logger";
import {
  liveAcknowledgement,
  loadTuffV2TestConfig,
  quoteCurveBuy,
  TUFF_V2_TEST,
} from "../keeper/tuff-v2-test-config";

const curveAbi = parseAbi([
  "function buy(uint256 quoteIn,uint256 minTokensOut,address recipient) payable returns (uint256 tokensOut)",
  "function sweepFees(uint256 minBuybackTokensOut)",
  "function getReserves() view returns (uint256 quoteReserve,uint256 tokenReserve)",
  "function sellableTokens() view returns (uint256)",
  "function feeBps() view returns (uint256)",
  "function creatorTaxBps() view returns (uint256)",
  "function currentSnipeTaxBps(address recipient) view returns (uint256)",
  "function quoteFeeBalance() view returns (uint256)",
  "function creatorTaxBalance() view returns (uint256)",
  "function buybackEnabled() view returns (bool)",
  "function buybackQuoteBalance() view returns (uint256)",
  "function isNativeQuote() view returns (bool)",
  "function pairToken() view returns (address)",
  "event CurveBuy(address indexed buyer,address indexed recipient,uint256 quoteIn,uint256 tokensOut,uint256 fee,uint256 tax)",
]);

const escrowAbi = parseAbi([
  "function balanceOf(address recipient) view returns (uint256)",
  "function claim(uint256 amount) returns (uint256 claimed)",
]);

const tokenAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from,address indexed to,uint256 value)",
]);

const factoryAbi = parseAbi([
  "struct LaunchedToken { address token; address curve; address deployer; address creatorFeeRecipient; address pairToken; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; uint16 creatorTaxBps; bool buybackEnabled; uint8 phase; uint256 sweptQuote; uint256 sweptTokens; uint256 sweptAt; bool exists; }",
  "function getLaunchedToken(address token) view returns (LaunchedToken)",
]);

type SimulatedLog = { address: Address; topics: readonly Hex[]; data: Hex };
type SimulatedCall = {
  status: Hex;
  gasUsed: Hex;
  returnData: Hex;
  logs: SimulatedLog[];
};

const zeroAddress = "0x0000000000000000000000000000000000000000";
const logger = new KeeperLogger();

async function simulateSequence(
  rpcUrl: string,
  calls: Array<{ from: Address; to: Address; input: Hex; value: bigint }>,
  gasPrice: bigint,
): Promise<SimulatedCall[]> {
  const maximumFeePerGas = gasPrice * 2n;
  if (maximumFeePerGas > TUFF_V2_TEST.maximumFeePerGasWei) {
    throw new Error(
      `Buffered max fee ${maximumFeePerGas} exceeds ${TUFF_V2_TEST.maximumFeePerGasWei}`,
    );
  }
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_simulateV1",
      params: [
        {
          blockStateCalls: [
            {
              calls: calls.map((call) => ({
                ...call,
                value: toHex(call.value),
                gas: toHex(TUFF_V2_TEST.maximumGasLimit),
                maxFeePerGas: toHex(maximumFeePerGas),
                maxPriorityFeePerGas: toHex(gasPrice / 10n || 1n),
              })),
            },
          ],
          validation: true,
          traceTransfers: true,
        },
        "latest",
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = (await response.json()) as {
    result?: Array<{ calls?: SimulatedCall[] }>;
    error?: { message?: string };
  };
  const simulated = payload.result?.[0]?.calls;
  if (!response.ok || payload.error || !simulated) {
    throw new Error(
      payload.error?.message || `eth_simulateV1 failed with HTTP ${response.status}`,
    );
  }
  if (simulated.length !== calls.length) {
    throw new Error("eth_simulateV1 returned an unexpected number of calls");
  }
  simulated.forEach((call, index) => {
    if (BigInt(call.status) !== 1n) {
      throw new Error(`Simulated transaction ${index + 1} reverted`);
    }
    if (BigInt(call.gasUsed) > TUFF_V2_TEST.maximumGasLimit) {
      throw new Error(`Simulated transaction ${index + 1} exceeded the gas limit`);
    }
  });
  return simulated;
}

function launchField(record: unknown, name: string, index: number): unknown {
  if (!record || typeof record !== "object") return undefined;
  return (record as Record<string, unknown>)[name] ??
    (Array.isArray(record) ? record[index] : undefined);
}

function assertLaunchRecord(record: unknown): void {
  const address = (name: string, index: number) => {
    const value = launchField(record, name, index);
    return typeof value === "string" ? getAddress(value) : undefined;
  };
  const phase = Number(launchField(record, "phase", 10));
  const exists = launchField(record, "exists", 14);
  if (
    exists !== true ||
    address("token", 0) !== TUFF_V2_TEST.token ||
    address("curve", 1) !== TUFF_V2_TEST.curve ||
    address("deployer", 2) !== TUFF_V2_TEST.creator ||
    address("creatorFeeRecipient", 3) !== TUFF_V2_TEST.creator ||
    address("pairToken", 4) !== zeroAddress ||
    phase !== 0
  ) {
    throw new Error("Pinned TUFF launch no longer matches the expected live curve");
  }
}

function simulatedBurnAmount(call: SimulatedCall): bigint {
  const tokensOut = decodeFunctionResult({
    abi: curveAbi,
    functionName: "buy",
    data: call.returnData,
  });
  const transferFound = call.logs.some((log) => {
    if (getAddress(log.address) !== TUFF_V2_TEST.token) return false;
    try {
      const decoded = decodeEventLog({
        abi: tokenAbi,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      });
      return (
        decoded.eventName === "Transfer" &&
        getAddress(decoded.args.to) === TUFF_V2_TEST.burnDestination &&
        decoded.args.value === tokensOut
      );
    } catch {
      return false;
    }
  });
  if (!transferFound) {
    throw new Error("Simulation did not transfer the purchased TUFF to the burn address");
  }
  return tokensOut;
}

async function main(): Promise<void> {
  const config = loadTuffV2TestConfig();
  const chain = defineChain({
    id: TUFF_V2_TEST.chainId,
    name: "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  });
  const client = createPublicClient({ chain, transport: http(config.rpcUrl) });

  const [actualChainId, tokenCode, curveCode, factoryCode, escrowCode] =
    await Promise.all([
      client.getChainId(),
      client.getBytecode({ address: TUFF_V2_TEST.token }),
      client.getBytecode({ address: TUFF_V2_TEST.curve }),
      client.getBytecode({ address: TUFF_V2_TEST.factory }),
      client.getBytecode({ address: TUFF_V2_TEST.feeEscrow }),
    ]);
  if (actualChainId !== TUFF_V2_TEST.chainId) {
    throw new Error(`RPC chain ID ${actualChainId} is not ${TUFF_V2_TEST.chainId}`);
  }
  if (!tokenCode || !curveCode || !factoryCode || !escrowCode) {
    throw new Error("One or more pinned Pons V2 contracts have no bytecode");
  }
  assertLaunchRecord(
    await client.readContract({
      address: TUFF_V2_TEST.factory,
      abi: factoryAbi,
      functionName: "getLaunchedToken",
      args: [TUFF_V2_TEST.token],
    }),
  );

  const [
    nativeQuote,
    pairToken,
    reserves,
    sellableTokens,
    feeBps,
    creatorTaxBps,
    snipeTaxBps,
    pendingBaseFees,
    pendingCreatorTax,
    buybackEnabled,
    buybackQuoteBalance,
    escrowBalance,
    symbol,
    decimals,
    signerBalance,
    signerLatestNonce,
    signerPendingNonce,
    burnBalanceBefore,
    gasPrice,
  ] = await Promise.all([
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "isNativeQuote",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "pairToken",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "getReserves",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "sellableTokens",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "feeBps",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "creatorTaxBps",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "currentSnipeTaxBps",
      args: [TUFF_V2_TEST.burnDestination],
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "quoteFeeBalance",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "creatorTaxBalance",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "buybackEnabled",
    }),
    client.readContract({
      address: TUFF_V2_TEST.curve,
      abi: curveAbi,
      functionName: "buybackQuoteBalance",
    }),
    client.readContract({
      address: TUFF_V2_TEST.feeEscrow,
      abi: escrowAbi,
      functionName: "balanceOf",
      args: [TUFF_V2_TEST.creator],
    }),
    client.readContract({
      address: TUFF_V2_TEST.token,
      abi: tokenAbi,
      functionName: "symbol",
    }),
    client.readContract({
      address: TUFF_V2_TEST.token,
      abi: tokenAbi,
      functionName: "decimals",
    }),
    client.getBalance({ address: TUFF_V2_TEST.creator }),
    client.getTransactionCount({
      address: TUFF_V2_TEST.creator,
      blockTag: "latest",
    }),
    client.getTransactionCount({
      address: TUFF_V2_TEST.creator,
      blockTag: "pending",
    }),
    client.readContract({
      address: TUFF_V2_TEST.token,
      abi: tokenAbi,
      functionName: "balanceOf",
      args: [TUFF_V2_TEST.burnDestination],
    }),
    client.getGasPrice(),
  ]);
  if (!nativeQuote || pairToken !== zeroAddress) {
    throw new Error("TUFF is not using the expected native ETH quote asset");
  }
  if (signerLatestNonce !== signerPendingNonce) {
    throw new Error(
      `Creator wallet has a pending transaction: latest ${signerLatestNonce}, pending ${signerPendingNonce}`,
    );
  }
  if (buybackEnabled || buybackQuoteBalance !== 0n) {
    throw new Error("TUFF's Pons-managed buyback state is not the expected disabled zero state");
  }
  if (pendingBaseFees + pendingCreatorTax + escrowBalance <= 0n) {
    throw new Error("TUFF has no creator fees available to fund this test");
  }

  const quote = quoteCurveBuy({
    quoteIn: TUFF_V2_TEST.buyAmountWei,
    quoteReserve: reserves[0],
    tokenReserve: reserves[1],
    sellableTokens,
    feeBps,
    creatorTaxBps,
    snipeTaxBps,
  });
  if (quote.spent !== TUFF_V2_TEST.buyAmountWei || quote.refund !== 0n) {
    throw new Error("TUFF quote would partially fill or refund the bounded test buy");
  }
  const minimumTokensOut =
    (quote.tokensOut * (10_000n - TUFF_V2_TEST.maximumSlippageBps)) / 10_000n;
  const sweepData = encodeFunctionData({
    abi: curveAbi,
    functionName: "sweepFees",
    args: [0n],
  });
  const claimData = encodeFunctionData({
    abi: escrowAbi,
    functionName: "claim",
    args: [TUFF_V2_TEST.buyAmountWei],
  });
  const buyData = encodeFunctionData({
    abi: curveAbi,
    functionName: "buy",
    args: [
      TUFF_V2_TEST.buyAmountWei,
      minimumTokensOut,
      TUFF_V2_TEST.burnDestination,
    ],
  });

  await logger.write("info", "tuff_v2_test_preflight", {
    mode: config.dryRun ? "dry-run" : "live",
    signer: TUFF_V2_TEST.creator,
    signerNonce: signerPendingNonce,
    signerBalanceWei: signerBalance,
    token: TUFF_V2_TEST.token,
    curve: TUFF_V2_TEST.curve,
    buyAmountWei: TUFF_V2_TEST.buyAmountWei,
    buyAmountEth: formatEther(TUFF_V2_TEST.buyAmountWei),
    quotedTokensOut: quote.tokensOut,
    quotedTokensFormatted: formatUnits(quote.tokensOut, decimals),
    minimumTokensOut,
    burnDestination: TUFF_V2_TEST.burnDestination,
    burnBalanceBefore,
    pendingBaseFeesWei: pendingBaseFees,
    pendingCreatorTaxWei: pendingCreatorTax,
    buybackEnabled,
    buybackQuoteBalanceWei: buybackQuoteBalance,
    escrowBalanceWei: escrowBalance,
    symbol,
    gasPriceWei: gasPrice,
  });

  if (config.dryRun) {
    const simulated = await simulateSequence(
      config.rpcUrl,
      [
        {
          from: TUFF_V2_TEST.creator,
          to: TUFF_V2_TEST.curve,
          input: sweepData,
          value: 0n,
        },
        {
          from: TUFF_V2_TEST.creator,
          to: TUFF_V2_TEST.feeEscrow,
          input: claimData,
          value: 0n,
        },
        {
          from: TUFF_V2_TEST.creator,
          to: TUFF_V2_TEST.curve,
          input: buyData,
          value: TUFF_V2_TEST.buyAmountWei,
        },
      ],
      gasPrice,
    );
    const burned = simulatedBurnAmount(simulated[2]);
    if (burned < minimumTokensOut) {
      throw new Error("Simulated TUFF output is below the slippage floor");
    }
    await logger.write("info", "tuff_v2_test_simulation_passed", {
      expectedNonce: signerPendingNonce,
      simulatedSweepGas: BigInt(simulated[0].gasUsed),
      simulatedClaimGas: BigInt(simulated[1].gasUsed),
      simulatedBuyGas: BigInt(simulated[2].gasUsed),
      simulatedTokensBurned: burned,
      simulatedTokensFormatted: formatUnits(burned, decimals),
      liveAcknowledgement: liveAcknowledgement(signerPendingNonce),
    });
    return;
  }

  if (config.privateKey === undefined || config.expectedNonce === undefined) {
    throw new Error("Live execution is missing its private key or expected nonce");
  }
  if (escrowBalance !== 0n) {
    throw new Error(
      "Fee escrow was nonzero before the sweep; stop and attribute that balance first",
    );
  }
  const account = privateKeyToAccount(config.privateKey);
  const wallet = createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  });
  let expectedNonce = config.expectedNonce;

  const submit = async (
    label: "sweep" | "claim" | "buy",
    to: Address,
    data: Hex,
    value: bigint,
  ) => {
    const [latest, pending, currentGasPrice] = await Promise.all([
      client.getTransactionCount({
        address: TUFF_V2_TEST.creator,
        blockTag: "latest",
      }),
      client.getTransactionCount({
        address: TUFF_V2_TEST.creator,
        blockTag: "pending",
      }),
      client.getGasPrice(),
    ]);
    if (latest !== pending || latest !== expectedNonce) {
      throw new Error(
        `Signer nonce mismatch: expected ${expectedNonce}, latest ${latest}, pending ${pending}`,
      );
    }
    const maximumFeePerGas = currentGasPrice * 2n;
    if (maximumFeePerGas > TUFF_V2_TEST.maximumFeePerGasWei) {
      throw new Error(
        `Buffered max fee ${maximumFeePerGas} exceeds ${TUFF_V2_TEST.maximumFeePerGasWei}`,
      );
    }
    await client.call({ account: TUFF_V2_TEST.creator, to, data, value });
    const estimatedGas = await client.estimateGas({
      account: TUFF_V2_TEST.creator,
      to,
      data,
      value,
    });
    const gas = (estimatedGas * 120n + 99n) / 100n;
    if (gas > TUFF_V2_TEST.maximumGasLimit) {
      throw new Error(`${label} gas ${gas} exceeds ${TUFF_V2_TEST.maximumGasLimit}`);
    }
    await logger.write("info", "tuff_v2_test_submitting", {
      label,
      nonce: expectedNonce,
      to,
      value,
      gas,
      maximumFeePerGas,
    });
    const hash = await wallet.sendTransaction({
      account,
      to,
      data,
      value,
      gas,
      nonce: expectedNonce,
      maxFeePerGas: maximumFeePerGas,
      maxPriorityFeePerGas: currentGasPrice / 10n || 1n,
    });
    await logger.write("info", "tuff_v2_test_submitted", {
      label,
      hash,
      nonce: expectedNonce,
    });
    const receipt = await client.waitForTransactionReceipt({
      hash,
      confirmations: config.confirmations,
      timeout: 180_000,
    });
    if (receipt.status !== "success") {
      throw new Error(`${label} transaction ${hash} reverted`);
    }
    await logger.write("info", "tuff_v2_test_confirmed", {
      label,
      hash,
      nonce: expectedNonce,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    });
    expectedNonce += 1;
    return receipt;
  };

  await submit("sweep", TUFF_V2_TEST.curve, sweepData, 0n);
  const claimable = await client.readContract({
    address: TUFF_V2_TEST.feeEscrow,
    abi: escrowAbi,
    functionName: "balanceOf",
    args: [TUFF_V2_TEST.creator],
  });
  if (claimable < TUFF_V2_TEST.buyAmountWei) {
    throw new Error("Sweep credited less than the exact 0.0005 ETH test claim");
  }
  await submit("claim", TUFF_V2_TEST.feeEscrow, claimData, 0n);

  const postClaimBalance = await client.getBalance({
    address: TUFF_V2_TEST.creator,
  });
  const requiredPostClaimBalance =
    TUFF_V2_TEST.buyAmountWei +
    TUFF_V2_TEST.maximumGasLimit * TUFF_V2_TEST.maximumFeePerGasWei +
    TUFF_V2_TEST.minimumPostClaimReserveWei;
  if (
    postClaimBalance < requiredPostClaimBalance
  ) {
    throw new Error(
      `Post-claim balance ${postClaimBalance} is below the buy, capped gas, and reserve requirement ${requiredPostClaimBalance}`,
    );
  }

  const buyReceipt = await submit(
    "buy",
    TUFF_V2_TEST.curve,
    buyData,
    TUFF_V2_TEST.buyAmountWei,
  );
  let burned = 0n;
  let eventQuoteIn = 0n;
  let burnTransferAmount = 0n;
  for (const log of buyReceipt.logs) {
    if (getAddress(log.address) === TUFF_V2_TEST.curve) {
      try {
        const decoded = decodeEventLog({
          abi: curveAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "CurveBuy") {
          if (
            getAddress(decoded.args.buyer) !== TUFF_V2_TEST.creator ||
            getAddress(decoded.args.recipient) !== TUFF_V2_TEST.burnDestination
          ) {
            throw new Error("Confirmed CurveBuy has an unexpected buyer or recipient");
          }
          eventQuoteIn = decoded.args.quoteIn;
          burned = decoded.args.tokensOut;
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Confirmed CurveBuy")) {
          throw error;
        }
      }
    }
    if (getAddress(log.address) === TUFF_V2_TEST.token) {
      try {
        const decoded = decodeEventLog({
          abi: tokenAbi,
          data: log.data,
          topics: log.topics,
        });
        if (
          decoded.eventName === "Transfer" &&
          getAddress(decoded.args.to) === TUFF_V2_TEST.burnDestination
        ) {
          burnTransferAmount = decoded.args.value;
        }
      } catch {
        // Ignore non-Transfer token logs.
      }
    }
  }
  if (
    eventQuoteIn !== TUFF_V2_TEST.buyAmountWei ||
    burned < minimumTokensOut ||
    burnTransferAmount !== burned
  ) {
    throw new Error("Confirmed buy did not match the bounded burn order");
  }
  const burnBalanceAfter = await client.readContract({
    address: TUFF_V2_TEST.token,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [TUFF_V2_TEST.burnDestination],
  });
  await logger.write("info", "tuff_v2_test_complete", {
    buyTransactionHash: buyReceipt.transactionHash,
    amountSpentWei: eventQuoteIn,
    amountSpentEth: formatEther(eventQuoteIn),
    tokensBurned: burned,
    tokensBurnedFormatted: formatUnits(burned, decimals),
    burnBalanceBefore,
    burnBalanceAfter,
    burnDestination: TUFF_V2_TEST.burnDestination,
  });
}

try {
  await main();
} catch (error) {
  await logger.write("error", "tuff_v2_test_failed", describeError(error));
  process.exitCode = 1;
}
