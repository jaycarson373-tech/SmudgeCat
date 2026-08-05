import { parseAbi } from "viem";

export const buybackVaultAbi = parseAbi([
  "function zazuToken() view returns (address)",
  "function dexRouter() view returns (address)",
  "function wrappedNativeToken() view returns (address)",
  "function feeToken() view returns (address)",
  "function buybackDestination() view returns (address)",
  "function keeper() view returns (address)",
  "function minimumExecutionAmount() view returns (uint256)",
  "function maximumExecutionAmount() view returns (uint256)",
  "function maximumSlippageBps() view returns (uint256)",
  "function minimumInterval() view returns (uint256)",
  "function lastExecutionTime() view returns (uint256)",
  "function availableTreasuryBalance() view returns (uint256)",
  "function paused() view returns (bool)",
  "function executeBuyback(uint256 amountIn, uint256 minimumZazuOut, bytes routerData)",
  "event BuybackExecuted(uint256 indexed executionId, address indexed inputAsset, uint256 amountIn, uint256 zazuReceived, address indexed destination, uint256 timestamp)",
]);

export const erc20ReadAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);
