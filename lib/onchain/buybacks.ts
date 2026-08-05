import { BUYBACK_EXECUTED_TOPIC } from "@/lib/onchain/buyback-vault";
import {
  decodeTopicAddress,
  decodeUint,
  encodeUintTopic,
  normalizeAddress,
  rpc,
  splitDataWords,
  transactionExplorerUrl,
  type RpcLog,
} from "@/lib/onchain/rpc";

export type DecodedBuyback = {
  executionId: string;
  inputAsset: string;
  amountInRaw: string;
  zazuReceivedRaw: string;
  destination: string;
  timestamp: string;
  transactionHash: string;
  explorerUrl: string;
  blockNumber: string;
};

export function configuredBuybackStartBlock(): string {
  const configured = process.env.BUYBACK_VAULT_START_BLOCK?.trim();
  if (!configured) {
    throw new Error(
      "BUYBACK_VAULT_START_BLOCK is required when the vault is configured.",
    );
  }
  if (/^0x[0-9a-fA-F]+$/.test(configured)) return configured;
  if (/^\d+$/.test(configured)) return `0x${BigInt(configured).toString(16)}`;
  throw new Error("BUYBACK_VAULT_START_BLOCK must be a block number.");
}

export async function readBuybackLogs(
  vaultAddress: string,
  executionIds: bigint[],
): Promise<DecodedBuyback[]> {
  if (executionIds.length === 0) return [];

  const idTopics = executionIds.map(encodeUintTopic);
  const logs = await rpc<RpcLog[]>("eth_getLogs", [
    {
      address: vaultAddress,
      fromBlock: configuredBuybackStartBlock(),
      toBlock: "latest",
      topics: [
        BUYBACK_EXECUTED_TOPIC,
        idTopics.length === 1 ? idTopics[0] : idTopics,
      ],
    },
  ]);

  const decoded = logs.map(decodeBuybackLog);
  if (decoded.length !== executionIds.length) {
    throw new Error(
      "RPC did not return every requested BuybackExecuted event. Check BUYBACK_VAULT_START_BLOCK.",
    );
  }

  return decoded.sort((left, right) => {
    const leftId = BigInt(left.executionId);
    const rightId = BigInt(right.executionId);
    return leftId === rightId ? 0 : leftId > rightId ? -1 : 1;
  });
}

export function decodeBuybackLog(log: RpcLog): DecodedBuyback {
  if (
    log.topics.length < 4 ||
    log.topics[0].toLowerCase() !== BUYBACK_EXECUTED_TOPIC
  ) {
    throw new Error("RPC returned an unexpected buyback event.");
  }
  const words = splitDataWords(log.data);
  if (words.length !== 3) {
    throw new Error("BuybackExecuted event contained unexpected data.");
  }

  return {
    executionId: decodeUint(log.topics[1]).toString(),
    inputAsset: decodeTopicAddress(log.topics[2]),
    amountInRaw: decodeUint(words[0]).toString(),
    zazuReceivedRaw: decodeUint(words[1]).toString(),
    destination: decodeTopicAddress(log.topics[3]),
    timestamp: decodeUint(words[2]).toString(),
    transactionHash: normalizeAddress(log.transactionHash),
    explorerUrl: transactionExplorerUrl(log.transactionHash),
    blockNumber: decodeUint(log.blockNumber).toString(),
  };
}
