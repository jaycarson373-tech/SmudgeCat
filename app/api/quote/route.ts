import {
  createPublicClient,
  defineChain,
  getAddress,
  http,
  isAddress,
  parseAbi,
  type Address,
} from "viem";

export const dynamic = "force-dynamic";

const tokenAbi = parseAbi([
  "function liquidityPool() view returns (address)",
]);

const poolAbi = parseAbi([
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
]);

const quoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
]);

const Q192 = 1n << 192n;

type QuoteRequestBody = {
  chainId?: unknown;
  vault?: unknown;
  router?: unknown;
  wrappedNativeToken?: unknown;
  inputToken?: unknown;
  outputToken?: unknown;
  recipient?: unknown;
  amountIn?: unknown;
  maximumSlippageBps?: unknown;
};

function requiredAddress(name: string): Address {
  const value = process.env[name]?.trim();
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`${name} is missing or invalid`);
  }
  return getAddress(value);
}

function requestAddress(value: unknown, name: string): Address {
  if (typeof value !== "string" || !isAddress(value, { strict: false })) {
    throw new Error(`${name} is missing or invalid`);
  }
  return getAddress(value);
}

function equalAddress(left: Address, right: Address) {
  return getAddress(left) === getAddress(right);
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const expectedApiKey = process.env.KEEPER_QUOTE_API_KEY?.trim();
  if (!expectedApiKey) return jsonError("Quote service is unavailable", 503);
  if (request.headers.get("authorization") !== `Bearer ${expectedApiKey}`) {
    return jsonError("Unauthorized", 401);
  }

  let body: QuoteRequestBody;
  try {
    body = (await request.json()) as QuoteRequestBody;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  try {
    const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 4663);
    if (!Number.isSafeInteger(expectedChainId) || expectedChainId <= 0) {
      throw new Error("NEXT_PUBLIC_CHAIN_ID is invalid");
    }
    if (body.chainId !== expectedChainId) throw new Error("chainId mismatch");

    const expectedRouter = requiredAddress("DEX_ROUTER_ADDRESS");
    const expectedVault = requiredAddress("BUYBACK_VAULT_ADDRESS");
    const wrappedNative = requiredAddress("WRAPPED_NATIVE_ADDRESS");
    const zazuToken = requiredAddress("NEXT_PUBLIC_ZAZU_ADDRESS");
    const quoter = requiredAddress("PONS_QUOTER_V2_ADDRESS");
    const vault = requestAddress(body.vault, "vault");
    const router = requestAddress(body.router, "router");
    const echoedWrappedNative = requestAddress(
      body.wrappedNativeToken,
      "wrappedNativeToken",
    );
    const inputToken = requestAddress(body.inputToken, "inputToken");
    const outputToken = requestAddress(body.outputToken, "outputToken");
    const recipient = requestAddress(body.recipient, "recipient");

    if (!equalAddress(router, expectedRouter)) throw new Error("router mismatch");
    if (!equalAddress(vault, expectedVault)) throw new Error("vault mismatch");
    if (!equalAddress(echoedWrappedNative, wrappedNative)) {
      throw new Error("wrappedNativeToken mismatch");
    }
    if (!equalAddress(inputToken, wrappedNative)) throw new Error("inputToken mismatch");
    if (!equalAddress(outputToken, zazuToken)) throw new Error("outputToken mismatch");
    if (!equalAddress(recipient, vault)) throw new Error("recipient must be the vault");

    if (typeof body.amountIn !== "string" || !/^\d+$/.test(body.amountIn)) {
      throw new Error("amountIn must be a positive base-10 string");
    }
    const amountIn = BigInt(body.amountIn);
    if (amountIn <= 0n) throw new Error("amountIn must be positive");
    if (
      typeof body.maximumSlippageBps !== "number" ||
      !Number.isSafeInteger(body.maximumSlippageBps) ||
      body.maximumSlippageBps <= 0 ||
      body.maximumSlippageBps > 500
    ) {
      throw new Error("maximumSlippageBps must be an integer from 1 through 500");
    }

    const poolFee = Number(process.env.PONS_POOL_FEE || 10_000);
    if (!Number.isSafeInteger(poolFee) || poolFee <= 0 || poolFee >= 1_000_000) {
      throw new Error("PONS_POOL_FEE is invalid");
    }

    const rpcUrl = process.env.ROBINHOOD_RPC_URL?.trim();
    if (!rpcUrl || !/^https:\/\//i.test(rpcUrl)) {
      throw new Error("ROBINHOOD_RPC_URL is missing or invalid");
    }
    const chain = defineChain({
      id: expectedChainId,
      name: "Robinhood Chain",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });
    const client = createPublicClient({ chain, transport: http(rpcUrl) });

    const pool = await client.readContract({
      address: zazuToken,
      abi: tokenAbi,
      functionName: "liquidityPool",
    });
    const [token0, token1, slot0, latestBlock, actualChainId] = await Promise.all([
      client.readContract({ address: pool, abi: poolAbi, functionName: "token0" }),
      client.readContract({ address: pool, abi: poolAbi, functionName: "token1" }),
      client.readContract({ address: pool, abi: poolAbi, functionName: "slot0" }),
      client.getBlock({ blockTag: "latest" }),
      client.getChainId(),
    ]);
    if (actualChainId !== expectedChainId) throw new Error("RPC chain mismatch");

    const validPair =
      (equalAddress(token0, wrappedNative) && equalAddress(token1, zazuToken)) ||
      (equalAddress(token0, zazuToken) && equalAddress(token1, wrappedNative));
    if (!validPair) throw new Error("Pons pool token pair mismatch");

    const { result } = await client.simulateContract({
      address: quoter,
      abi: quoterAbi,
      functionName: "quoteExactInputSingle",
      args: [{
        tokenIn: wrappedNative,
        tokenOut: zazuToken,
        amountIn,
        fee: poolFee,
        sqrtPriceLimitX96: 0n,
      }],
    });

    const [quotedOutput] = result;
    if (quotedOutput <= 0n) throw new Error("Pons quote returned zero output");

    const sqrtPriceX96 = slot0[0];
    const squaredPrice = sqrtPriceX96 * sqrtPriceX96;
    const spotOutput = equalAddress(wrappedNative, token0)
      ? (amountIn * squaredPrice) / Q192
      : (amountIn * Q192) / squaredPrice;
    if (spotOutput <= 0n) throw new Error("Pons pool spot price is unavailable");

    const spotOutputAfterPoolFee =
      (spotOutput * BigInt(1_000_000 - poolFee)) / 1_000_000n;
    if (spotOutputAfterPoolFee <= 0n) {
      throw new Error("Pons pool fee-adjusted spot price is unavailable");
    }
    const impact = quotedOutput >= spotOutputAfterPoolFee
      ? 0n
      : ((spotOutputAfterPoolFee - quotedOutput) * 10_000n) / spotOutputAfterPoolFee;
    const priceImpactBps = Number(impact > 9_999n ? 9_999n : impact);

    return Response.json(
      {
        quoteId: `${latestBlock.number.toString()}:${pool}`,
        chainId: expectedChainId,
        router: expectedRouter,
        wrappedNativeToken: wrappedNative,
        inputToken: wrappedNative,
        outputToken: zazuToken,
        recipient: vault,
        amountIn: amountIn.toString(),
        maximumSlippageBps: body.maximumSlippageBps,
        quotedOutput: quotedOutput.toString(),
        priceImpactBps,
        routerData: "0x",
        expiresAt: Number(latestBlock.timestamp + 60n),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to quote the pons pool",
      400,
    );
  }
}
