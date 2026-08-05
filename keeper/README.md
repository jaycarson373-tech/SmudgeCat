# ZAZU keeper

The keeper is a fail-closed TypeScript service. It checks the vault once per minute, but only submits a buyback after the contract's `minimumInterval` has elapsed and every treasury, quote, price-impact, gas, and simulation check passes. If the maximum permitted buy would exceed the price-impact ceiling, it automatically quotes progressively smaller bounded amounts and executes the first safe size. The configured minimum buy is always the final candidate.

It does not contain a router address or private key. Production addresses are environment pins. If the vault configuration differs from those pins, the cycle stops safely.

## Run

Install `viem` as a runtime dependency and `tsx` as a development dependency. Copy `keeper/.env.example` to a secure path outside the repository, fill every required field, then start the service with Node 22 or newer:

```sh
node --env-file=/secure/path/zazu-keeper.env --import=tsx scripts/keeper.ts
```

Use `KEEPER_DRY_RUN=true` with `KEEPER_ADDRESS` and no private key to exercise reads, quoting, limits, and simulation without submitting a transaction. `KEEPER_RUN_ONCE=true` performs one cycle and exits.

## Quote service contract

`KEEPER_QUOTE_API_URL` must be a trusted quote service for the separately verified DEX adapter and underlying Robinhood Chain DEX. The keeper sends an HTTP `POST` with:

```json
{
  "chainId": 0,
  "vault": "0x...",
  "router": "0x...",
  "wrappedNativeToken": "0x...",
  "inputToken": "0x...",
  "outputToken": "0x...",
  "recipient": "0x...",
  "amountIn": "1000000000000000000",
  "maximumSlippageBps": 100
}
```

The response must echo all request fields and provide:

```json
{
  "quoteId": "optional-provider-id",
  "chainId": 0,
  "router": "0x...",
  "wrappedNativeToken": "0x...",
  "inputToken": "0x...",
  "outputToken": "0x...",
  "recipient": "0x...",
  "amountIn": "1000000000000000000",
  "maximumSlippageBps": 100,
  "quotedOutput": "250000000000000000000",
  "priceImpactBps": 42,
  "routerData": "0x12345678...",
  "expiresAt": 1900000000
}
```

Amounts are unsigned base-unit strings. `expiresAt` is a Unix timestamp in seconds. The recipient must be the vault so the vault can measure the received ZAZU balance before forwarding it to the configured destination. For native fees, `inputToken` is the zero address.

The quote service should derive its quote from current onchain pool state and build route data for the verified `IDexAdapter` implementation. The keeper does not trust the response blindly. It verifies echoed addresses and amounts, checks expiry and price impact, derives `minimumZazuOut` from the vault slippage limit, simulates the complete vault call, and applies gas ceilings before submitting. The DEX adapter must separately validate route data and enforce the typed input, output, amount, minimum output, and recipient supplied by the vault.

## Concurrency and retries

The process holds an atomic file lock with a heartbeat. This prevents overlapping instances on a host or shared filesystem. Stale locks are never removed automatically because safe compare-and-delete is not available through the portable Node filesystem API. An operator must verify that no keeper is running before removing the exact stale lock file. Production orchestration should also run one replica or provide a shared persistent lock volume. The vault's onchain interval check remains the final concurrency backstop.

Read-only RPC operations use capped exponential backoff with jitter. A reverted simulation is never retried automatically. The submitted transaction carries the checked buffered gas limit and either explicit EIP-1559 fee caps or an explicit legacy gas price. If either the maximum gas units or maximum total fee cannot be bounded, the cycle is skipped. Transaction submission is attempted exactly once because an RPC timeout can leave submission status uncertain. A submission error or unresolved receipt halts the keeper and requires transaction-hash and signer-nonce reconciliation before restart.

Confirmed executions are written as structured JSON to standard output and optionally to `KEEPER_LOG_FILE`. Each confirmation includes the transaction hash, amount spent, ZAZU received, effective price, destination, block, event ID, and gas data.
