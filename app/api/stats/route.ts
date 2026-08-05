import {
  BUYBACK_VAULT_SELECTORS,
  ERC20_SELECTORS,
  ZERO_ADDRESS,
} from "@/lib/onchain/buyback-vault";
import {
  configuredBuybackStartBlock,
  readBuybackLogs,
} from "@/lib/onchain/buybacks";
import {
  addressExplorerUrl,
  configuredExpectedChainId,
  configuredExpectedTokenAddress,
  configuredVaultAddress,
  decodeUint,
  encodeAddressArgument,
  ethCall,
  formatUnits,
  readAddress,
  readTokenMetadata,
  readUint,
  rpc,
  transactionExplorerUrl,
} from "@/lib/onchain/rpc";

export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "cache-control": "public, s-maxage=15, stale-while-revalidate=45",
};

function unconfiguredResponse(error?: string) {
  return Response.json(
    {
      configured: false,
      chainId: null,
      vaultAddress: null,
      vaultExplorerUrl: null,
      tokenAddress: null,
      treasury: null,
      totalInputSpentRaw: null,
      totalInputSpentFormatted: null,
      totalZazuBoughtRaw: null,
      totalZazuBoughtFormatted: null,
      totalZazuBurnedRaw: null,
      totalZazuBurnedFormatted: null,
      totalExecutions: null,
      lastExecutionTimestamp: null,
      nextEligibleExecutionTimestamp: null,
      minimumIntervalSeconds: null,
      destination: null,
      latestTransaction: null,
      updatedAt: new Date().toISOString(),
      ...(error ? { error } : {}),
    },
    { headers: RESPONSE_HEADERS },
  );
}

export async function GET() {
  const vault = configuredVaultAddress();
  if (!vault.address) return unconfiguredResponse(vault.error ?? undefined);
  if (vault.address === ZERO_ADDRESS) {
    return unconfiguredResponse("BUYBACK_VAULT_ADDRESS cannot be the zero address.");
  }

  const expectedToken = configuredExpectedTokenAddress();
  if (!expectedToken.address) {
    return unconfiguredResponse(expectedToken.error ?? undefined);
  }
  const expectedChain = configuredExpectedChainId();
  if (expectedChain.chainId === null) {
    return unconfiguredResponse(expectedChain.error ?? undefined);
  }

  try {
    configuredBuybackStartBlock();
    const [
      chainIdHex,
      contractCode,
      feeToken,
      zazuToken,
      destination,
      minimumInterval,
      lastExecutionTime,
      executionCount,
      totalInputSpent,
      totalZazuBought,
      totalZazuBurned,
    ] = await Promise.all([
      rpc<string>("eth_chainId", []),
      rpc<string>("eth_getCode", [vault.address, "latest"]),
      readAddress(vault.address, BUYBACK_VAULT_SELECTORS.feeToken),
      readAddress(vault.address, BUYBACK_VAULT_SELECTORS.zazuToken),
      readAddress(vault.address, BUYBACK_VAULT_SELECTORS.buybackDestination),
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.minimumInterval),
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.lastExecutionTime),
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.executionCount),
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.totalInputSpent),
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.totalZazuBought),
      readUint(vault.address, BUYBACK_VAULT_SELECTORS.totalZazuBurned),
    ]);

    if (contractCode === "0x" || contractCode === "0x0") {
      throw new Error("BUYBACK_VAULT_ADDRESS has no contract code on this RPC.");
    }
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

    const zazuMetadata = await readTokenMetadata(zazuToken);
    let treasury: {
      asset: "native" | "erc20";
      address: string;
      symbol: string;
      decimals: number;
      balanceRaw: string;
      balanceFormatted: string;
    };
    let inputDecimals: number;

    if (feeToken === ZERO_ADDRESS) {
      const balanceRaw = decodeUint(
        await rpc<string>("eth_getBalance", [vault.address, "latest"]),
      );
      inputDecimals = 18;
      treasury = {
        asset: "native",
        address: ZERO_ADDRESS,
        symbol: process.env.ROBINHOOD_NATIVE_SYMBOL?.trim() || "ETH",
        decimals: inputDecimals,
        balanceRaw: balanceRaw.toString(),
        balanceFormatted: formatUnits(balanceRaw, inputDecimals),
      };
    } else {
      const [metadata, balanceResult] = await Promise.all([
        readTokenMetadata(feeToken),
        ethCall(
          feeToken,
          `${ERC20_SELECTORS.balanceOf}${encodeAddressArgument(vault.address)}`,
        ),
      ]);
      const balanceRaw = decodeUint(balanceResult);
      inputDecimals = metadata.decimals;
      treasury = {
        asset: "erc20",
        address: feeToken,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        balanceRaw: balanceRaw.toString(),
        balanceFormatted: formatUnits(balanceRaw, metadata.decimals),
      };
    }

    const latestLog = executionCount > BigInt(0)
      ? (await readBuybackLogs(vault.address, [executionCount]))[0] ?? null
      : null;
    const nextEligibleExecution = lastExecutionTime > BigInt(0)
      ? lastExecutionTime + minimumInterval
      : BigInt(0);

    return Response.json(
      {
        configured: true,
        chainId: chainId.toString(),
        vaultAddress: vault.address,
        vaultExplorerUrl: addressExplorerUrl(vault.address),
        tokenAddress: zazuToken,
        treasury,
        totalInputSpentRaw: totalInputSpent.toString(),
        totalInputSpentFormatted: formatUnits(totalInputSpent, inputDecimals),
        totalZazuBoughtRaw: totalZazuBought.toString(),
        totalZazuBoughtFormatted: formatUnits(
          totalZazuBought,
          zazuMetadata.decimals,
        ),
        totalZazuBurnedRaw: totalZazuBurned.toString(),
        totalZazuBurnedFormatted: formatUnits(
          totalZazuBurned,
          zazuMetadata.decimals,
        ),
        totalExecutions: executionCount.toString(),
        lastExecutionTimestamp: executionCount > BigInt(0)
          ? lastExecutionTime.toString()
          : null,
        nextEligibleExecutionTimestamp: nextEligibleExecution.toString(),
        minimumIntervalSeconds: minimumInterval.toString(),
        destination,
        latestTransaction: latestLog
          ? {
              hash: latestLog.transactionHash,
              explorerUrl: transactionExplorerUrl(latestLog.transactionHash),
              timestamp: latestLog.timestamp,
            }
          : null,
        updatedAt: new Date().toISOString(),
      },
      { headers: RESPONSE_HEADERS },
    );
  } catch (error) {
    return Response.json(
      {
        configured: true,
        chainId: null,
        vaultAddress: vault.address,
        vaultExplorerUrl: addressExplorerUrl(vault.address),
        tokenAddress: null,
        treasury: null,
        totalInputSpentRaw: null,
        totalInputSpentFormatted: null,
        totalZazuBoughtRaw: null,
        totalZazuBoughtFormatted: null,
        totalZazuBurnedRaw: null,
        totalZazuBurnedFormatted: null,
        totalExecutions: null,
        lastExecutionTimestamp: null,
        nextEligibleExecutionTimestamp: null,
        minimumIntervalSeconds: null,
        destination: null,
        latestTransaction: null,
        error: error instanceof Error
          ? error.message
          : "Unable to read buyback vault stats.",
        updatedAt: new Date().toISOString(),
      },
      { status: 502, headers: RESPONSE_HEADERS },
    );
  }
}
