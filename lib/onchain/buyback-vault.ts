export const BUYBACK_VAULT_SELECTORS = {
  feeToken: "0x647846a5",
  zazuToken: "0x84fc7910",
  buybackDestination: "0xc563127c",
  minimumInterval: "0x51cfaf73",
  lastExecutionTime: "0x73b379bd",
  executionCount: "0xa17ecef3",
  totalInputSpent: "0x342ffc90",
  totalZazuBought: "0xd8b6eb7a",
} as const;

export const ERC20_SELECTORS = {
  balanceOf: "0x70a08231",
  decimals: "0x313ce567",
  symbol: "0x95d89b41",
} as const;

export const BUYBACK_EXECUTED_TOPIC =
  "0x4ff168e44814be9a5767d8eeafd5dee7e655804ba7ffa0fc59b2237d0b820385";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
