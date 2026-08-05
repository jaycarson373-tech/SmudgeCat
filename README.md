# ZAZU Buyback Protocol

A launch-ready prototype for a transparent creator-fee buyback system and its public Zazu terminal. The repository contains a fixed-supply token, a guarded buyback vault, an off-chain keeper, read-only public APIs, and the exact lo-fi elemental Zazu website.

> Status: prototype only. No production token, vault, DEX adapter, underlying router, fee source, quote service, keeper, or destination address is configured in this repository. Do not send funds to an address until it appears in the public registry and its source code is verified on the intended explorer.

## What is included

| Layer | Location | Responsibility |
| --- | --- | --- |
| Website | `app/`, `components/`, `public/` | Zazu launch page, 40-image archive, public buyback terminal, and contract registry |
| Token | `contracts/src/ZazuToken.sol` | Fixed supply ZAZU token with no post-deployment mint path |
| Vault | `contracts/src/BuybackVault.sol` | Receives one configured fee asset, enforces bounded swaps, forwards purchased ZAZU, and emits public events |
| Keeper | `scripts/keeper.ts`, `keeper/` | Checks eligibility, validates quotes, simulates execution, applies gas limits, and submits an eligible transaction |
| Public API | `app/api/stats`, `app/api/buybacks` | Reads vault state and `BuybackExecuted` logs from the configured RPC |
| Tests | `contracts/test/`, `tests/` | Solidity unit and invariant coverage plus rendered-site assertions |

## Architecture

```text
Verified creator-fee source
          |
          v
BuybackVault treasury  <----- public RPC reads -----  /api/stats
          |                                         /api/buybacks
          | eligible only after 15 minutes
          v
Off-chain keeper
  |  verifies pinned contract configuration
  |  requests a current DEX quote
  |  checks expiry, price impact, slippage, and gas
  |  simulates the full vault call
  v
Verified DEX adapter
  |  forces input, output, amount, minimum output, and recipient
  v
Independently verified DEX router
          |
          | sends purchased ZAZU back to the vault
          v
BuybackVault measures exact input spent and ZAZU received
          |
          v
Configured destination + BuybackExecuted event
```

The website never supplies accounting totals. It reads contract getters and event logs. If the vault is not configured, the terminal says so and displays no invented on-chain activity.

## Fee flow

1. The launch platform or another independently verified source routes creator fees to the deployed vault.
2. A vault accepts either the native gas asset or one configured ERC-20 fee token. Native funds arrive through `receive`; ERC-20 funds use `depositERC20` and actual balance-delta accounting.
3. The keeper polls once per minute. Polling does not make a buyback eligible.
4. The contract permits another execution only when `lastExecutionTime + minimumInterval` has elapsed and the requested amount is within its configured minimum and maximum.
5. The keeper asks a trusted quote service for current adapter-specific route data, then validates all echoed addresses, amount, chain, expiry, price impact, and slippage inputs.
6. The keeper simulates the complete vault transaction and rejects it if gas limits or balance checks fail.
7. During execution, the vault calls one typed `IDexAdapter.swap` function. The vault forces the input asset, ZAZU output, exact input, minimum output, and vault recipient. It then verifies exact balance deltas.
8. The vault forwards exactly the measured ZAZU balance increase to `buybackDestination` and emits `BuybackExecuted`.
9. The public APIs and terminal expose the resulting event and cumulative vault counters.

Pons is the intended launch path, but Pons fee routing is not implemented or verified by this repository. Before launch, confirm the exact creator-fee asset, collection method, router, and Robinhood Chain integration from primary documentation and on-chain tests.

## Why a keeper is necessary

An EVM contract cannot wake itself up on a clock or fetch a safe market quote. The vault therefore exposes one narrow execution function to a designated keeper. The keeper performs work that cannot happen inside the contract:

- checks chain time and treasury balance;
- obtains fresh adapter route data from a quote service;
- rejects stale or mismatched quotes;
- applies an independent price-impact ceiling;
- derives minimum output from the vault slippage limit;
- simulates the complete transaction;
- enforces maximum gas units and gas cost;
- prevents overlapping local processes;
- submits once, then waits for confirmations without blindly resubmitting.

The keeper is not an administrator and receives no token allowance from the vault. It cannot call owner-only configuration or rescue functions. A compromised keeper can still attempt the vault's bounded adapter path, so the keeper key, configured adapter, quote service, execution limits, and destination all remain security-critical.

## Fifteen-minute eligibility

The interval is a minimum separation between successful executions, not a schedule or promise.

An execution can be eligible after 15 minutes and still be skipped because:

- the treasury is below its minimum;
- the vault is paused;
- the quote is unavailable, stale, or malformed;
- price impact or slippage is too high;
- simulation reverts;
- gas exceeds a configured ceiling;
- the keeper has insufficient gas funds;
- the RPC, network, router, or liquidity is unavailable;
- pinned configuration differs from on-chain configuration.

Approved public wording is: **Eligible every 15 minutes. Executed only when every safety check passes.**

## Contract safety model

### ZazuToken

- Fixed supply of 1,000,000,000 ZAZU at deployment.
- No external mint function.
- Two-step ownership transfer.
- Ownership renouncement requires a separate irreversible enable action.

### BuybackVault

- Only the configured keeper can call `executeBuyback`.
- Minimum and maximum input amounts bound every execution.
- Nonzero minimum output and a 500 bps on-chain slippage-configuration hard cap limit adverse execution.
- The vault calls a separately verified DEX adapter through a narrow typed interface. It never executes arbitrary raw router calldata.
- The adapter must consume the exact requested fee amount and return ZAZU to the vault.
- Purchased ZAZU must first return to the vault, where its balance delta is measured.
- Only the measured output is forwarded to the configured destination.
- Reentrancy protection, pausing, and zeroed ERC-20 allowances reduce execution risk.
- Deposits, cumulative spend, cumulative ZAZU purchases, and execution count are public.
- Router and destination changes become timelocked after the one-way configuration timelock is enabled.
- Protected-asset recovery requires the vault to be paused and the enabled timelock to elapse. The scheduled amount is fixed and unpausing cancels it.
- Native currency forced into an ERC-20 fee vault can be recovered only while paused. A configured native treasury remains protected by the timelocked path.
- Ownership uses a two-step transfer and should be accepted by a reviewed multisig before production use.

The owner retains meaningful powers, including pause, keeper replacement, execution-limit changes, slippage changes, scheduled router or destination changes, and emergency recovery. This is not a trustless or audited system. Publish the owner, timelock, destination, and every configuration change.

A destination should only be described as a burn address if it is demonstrably irrecoverable. A rewards vault or locked treasury is not a burn.

## Public API

Both endpoints are read-only, force dynamic rendering, fail closed against the expected chain, token, and vault, and return an honest `configured: false` state when no vault is set. Responses use a short CDN cache to protect the public RPC from per-visitor polling bursts, and every payload includes `updatedAt`.

### `GET /api/stats`

Returns:

- RPC-derived chain ID and deployed vault and token addresses;
- native or ERC-20 treasury balance with raw and formatted values;
- cumulative input spent and ZAZU bought;
- execution count;
- last execution time, minimum interval, and next eligible time;
- configured destination;
- latest verified transaction hash and explorer link.

Every on-chain integer is serialized as a decimal string to avoid unsafe JavaScript number conversion.

### `GET /api/buybacks?page=1&pageSize=20`

Returns newest-first `BuybackExecuted` events, including raw and formatted amounts, input asset, destination, timestamp, transaction hash, block number, and explorer URL. `pageSize` is capped at 50. `BUYBACK_VAULT_START_BLOCK` is required once a vault is configured so log reads stay narrow and complete.

## Keeper operation

Install dependencies, copy `keeper/.env.example` to a secure file outside the repository, and fill every required pin.

Run a fail-closed dry check:

```bash
npm install
KEEPER_DRY_RUN=true KEEPER_RUN_ONCE=true node --env-file=/secure/path/zazu-keeper.env --import=tsx scripts/keeper.ts
```

Run the polling service only after a successful dry run and independent review:

```bash
node --env-file=/secure/path/zazu-keeper.env --import=tsx scripts/keeper.ts
```

Production secrets must stay outside the repository. Use a dedicated, minimally funded keeper key. Run one active replica or provide a shared persistent lock. Monitor structured logs and alert on configuration mismatches, repeated quote failures, uncertain submission state, missed confirmations, and owner configuration events.

The quote service and DEX adapter are external dependencies. The quote service must derive quotes from current on-chain liquidity and return route data for one independently reviewed adapter. The adapter must validate that route data before calling the underlying DEX. The keeper validates the quote response, but this repository does not provide a production DEX adapter, quote service, or underlying router integration. Production execution must remain disabled until all three are implemented, verified, and tested together.

## Local development

Requirements:

- Node.js 22.13 or newer
- Foundry for Solidity compilation and tests

```bash
npm install
npm run contracts:install
cp .env.example .env.local
npm run dev
```

Leave token and vault addresses blank for the honest pre-deployment state.

## Testing

```bash
npm run contracts:install # once on a fresh clone
npm run test:contracts
npm run test:app
npm run typecheck
npm run lint
```

`npm test` runs the contract and rendered-app suites. Contract tests cover native and ERC-20 deposits, successful execution, interval enforcement, authorization, limits, slippage failure, exact input spend, destination accounting, pause behavior, reentrancy, ownership, timelocked configuration, rescue paths, fuzzing, and accounting invariants.

The app test builds the site and verifies the Zazu identity, exact elemental artwork, 40-file archive, public terminal, contract-derived wording, safety rails, pre-deployment state, and removal of prior project remnants or fabricated countdown values.

## Testnet and deployment checklist

Do not skip testnet because the website looks finished.

1. Independently confirm the intended Robinhood Chain network, chain ID, RPC, explorer, native asset, wrapped native token, and final underlying DEX router from primary sources.
2. Verify Pons supports the intended network and determine exactly how creator fees are claimed or routed.
3. Implement and audit a router-specific `IDexAdapter`, then implement and secure its quote service against the verified underlying router.
4. Choose and publish the adapter, underlying router, fee asset, minimum and maximum execution amounts, slippage cap, keeper, destination, multisig owner, and configuration delay.
5. Create a dedicated deployer and keeper. Never reuse a personal wallet or expose keys in shell history, logs, or source control.
6. Run all Solidity tests and inspect compiler output.
7. Deploy on testnet with `contracts/script/DeployRobinhoodTestnet.s.sol` and an explicitly pinned `CHAIN_ID`.
8. Verify token and vault source code on the testnet explorer.
9. Confirm every immutable and mutable getter against the deployment manifest.
10. Have the multisig accept pending ownership for every newly deployed contract.
11. Deposit a minimal test fee amount and run the keeper in dry-run mode.
12. Execute one minimal live test buyback. Confirm exact treasury spend, ZAZU output, destination receipt, event fields, allowances, counters, and API rows.
13. Exercise pause, keeper rotation, scheduled configuration changes, cancellation, and protected rescue on testnet.
14. Test unavailable quotes, stale quotes, high impact, high gas, RPC failure, simulation revert, uncertain submission, and duplicate-process locking.
15. Obtain independent smart-contract, keeper, deployment, and operational review.
16. Only then deploy through `contracts/script/DeployRobinhoodMainnet.s.sol` with the multisig requirement satisfied.
17. Verify production source code, accept multisig ownership, publish all addresses, and record the vault deployment block.
18. Set the public website and API variables, redeploy, and verify that all explorer links and API values match the chain.
19. Start the keeper with conservative limits, monitoring, alerts, and an incident runbook.
20. Route a small real creator-fee amount first and confirm the full public loop before increasing limits.

## Public verification after deployment

A launch announcement should provide:

- chain ID and explorer;
- token contract;
- BuybackVault contract and verified source;
- vault deployment block;
- fee asset;
- verified DEX adapter, underlying router, and wrapped native token;
- keeper address;
- destination with a precise explanation of whether it burns, locks, or distributes;
- multisig owner and timelock delay;
- minimum and maximum execution amount;
- slippage and keeper price-impact limits;
- links to `/api/stats` and `/api/buybacks`;
- the first successful `BuybackExecuted` transaction.

Anyone should be able to reconcile vault balance, total deposited, total input spent, total ZAZU bought, destination receipts, and emitted events without relying on a screenshot or social post.

## Current assumptions and missing launch inputs

- The UI currently targets Robinhood Chain and displays chain ID 4663 by default. Deployment scripts require an explicit `CHAIN_ID` and abort on mismatch. Reconfirm it before use.
- No production ZAZU token address exists in configuration.
- No production BuybackVault address or deployment block exists in configuration.
- No DEX adapter, underlying router, wrapped native token, fee token, creator-fee route, keeper, quote service, destination, multisig, or final safety limits have been approved.
- No testnet deployment or end-to-end transaction is documented yet.
- No independent audit or production readiness review has been completed.
- No claim of automatic Pons fee routing, Robinhood endorsement, guaranteed cadence, or guaranteed burn is supported yet.

The public site intentionally renders `AWAITING VERIFIED DEPLOYMENT` and `AWAITING VERIFIED VAULT` until the missing values are supplied.

## Project disclaimer

$ZAZU is a community meme-token prototype and can lose all value. This repository is not financial advice. The project is independent and is not affiliated with or endorsed by Robinhood, Pons, any DEX, or Zazu's owner.
