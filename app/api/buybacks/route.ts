import {
  BUYBACK_VAULT_SELECTORS,
  ZERO_ADDRESS,
} from "@/lib/onchain/buyback-vault";
import {
  configuredBuybackStartBlock,
  readBuybackLogs,
} from "@/lib/onchain/buybacks";
import {
  configuredExpectedChainId,
  configuredExpectedTokenAddress,
  configuredVaultAddress,
  decodeUint,
  formatUnits,
  readAddress,
  readTokenMetadata,
  readUint,
  rpc,
} from "@/lib/onchain/rpc";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const RESPONSE_HEADERS = {
  "cache-control": "public, s-maxage=30, stale-while-revalidate=90",
};

function positiveInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number | null {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    return null;
  }
  return parsed;
}

function unconfiguredResponse(
  page: number,
  pageSize: number,
  error?: string,
) {
  return Response.json(
    {
      configured: false,
      page,
      pageSize,
      total: null,
      items: [],
      nextPage: null,
      ...(error ? { error } : {}),
    },
    { headers: RESPONSE_HEADERS },
  );
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const vault = configuredVaultAddress();
  const page = positiveInteger(searchParams.get("page"), 1, 1_000_000);
  const pageSize = positiveInteger(
    searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );

  if (page === null || pageSize === null) {
    return Response.json(
      {
        configured: Boolean(vault.address),
        error: `page must be a positive integer and pageSize must be between 1 and ${MAX_PAGE_SIZE}.`,
      },
      { status: 400, headers: RESPONSE_HEADERS },
    );
  }

  if (!vault.address) {
    return unconfiguredResponse(page, pageSize, vault.error ?? undefined);
  }
  if (vault.address === ZERO_ADDRESS) {
    return unconfiguredResponse(
      page,
      pageSize,
      "BUYBACK_VAULT_ADDRESS cannot be the zero address.",
    );
  }
  const expectedToken = configuredExpectedTokenAddress();
  if (!expectedToken.address) {
    return unconfiguredResponse(page, pageSize, expectedToken.error ?? undefined);
  }
  const expectedChain = configuredExpectedChainId();
  if (expectedChain.chainId === null) {
    return unconfiguredResponse(page, pageSize, expectedChain.error ?? undefined);
  }

  try {
    configuredBuybackStartBlock();
    const [executionCount, zazuToken, chainIdHex] = await Promise.all([
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.executionCount),
      readAddress(vault.address, BUYBACK_VAULT_SELECTORS.zazuToken),
      rpc<string>("eth_chainId", []),
    ]);
    const chainId = decodeUint(chainIdHex);
    if (chainId !== expectedChain.chainId) {
      throw new Error(
        `RPC chain ID ${chainId} does not match configured CHAIN_ID ${expectedChain.chainId}.`,
      );
    }
    if (zazuToken !== expectedToken.address) {
      throw new Error(
        "Vault ZAZU token does not match configured ZAZU_TOKEN_ADDRESS.",
      );
    }
    const offset = BigInt(page - 1) * BigInt(pageSize);

    if (offset >= executionCount) {
      return Response.json(
        {
          configured: true,
          page,
          pageSize,
          total: executionCount.toString(),
          tokenAddress: zazuToken,
          items: [],
          nextPage: null,
        },
        { headers: RESPONSE_HEADERS },
      );
    }

    const newestId = executionCount - offset;
    const oldestId = newestId > BigInt(pageSize)
      ? newestId - BigInt(pageSize) + BigInt(1)
      : BigInt(1);
    const executionIds: bigint[] = [];
    for (let id = newestId; id >= oldestId; id -= BigInt(1)) {
      executionIds.push(id);
    }

    const [logs, zazuMetadata] = await Promise.all([
      readBuybackLogs(vault.address, executionIds),
      readTokenMetadata(zazuToken),
    ]);
    const uniqueInputAssets = [...new Set(logs.map((log) => log.inputAsset))];
    const inputMetadata = new Map<
      string,
      { decimals: number; symbol: string }
    >();

    await Promise.all(
      uniqueInputAssets.map(async (asset) => {
        if (asset === ZERO_ADDRESS) {
          inputMetadata.set(asset, {
            decimals: 18,
            symbol: process.env.ROBINHOOD_NATIVE_SYMBOL?.trim() || "ETH",
          });
          return;
        }
        inputMetadata.set(asset, await readTokenMetadata(asset));
      }),
    );

    const items = logs.map((log) => {
      const metadata = inputMetadata.get(log.inputAsset);
      if (!metadata) {
        throw new Error("Unable to read input token metadata for a buyback.");
      }
      return {
        ...log,
        amountInFormatted: formatUnits(BigInt(log.amountInRaw), metadata.decimals),
        inputSymbol: metadata.symbol,
        zazuReceivedFormatted: formatUnits(
          BigInt(log.zazuReceivedRaw),
          zazuMetadata.decimals,
        ),
        tokenSymbol: zazuMetadata.symbol,
      };
    });

    return Response.json(
      {
        configured: true,
        page,
        pageSize,
        total: executionCount.toString(),
        tokenAddress: zazuToken,
        items,
        nextPage: oldestId > BigInt(1) ? page + 1 : null,
      },
      { headers: RESPONSE_HEADERS },
    );
  } catch (error) {
    return Response.json(
      {
        configured: true,
        page,
        pageSize,
        total: null,
        items: [],
        nextPage: null,
        error: error instanceof Error
          ? error.message
          : "Unable to read buyback history.",
      },
      { status: 502, headers: RESPONSE_HEADERS },
    );
  }
}
