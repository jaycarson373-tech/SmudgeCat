# ZAZU Brand and Launch Copy

This file is the copy source of truth for the Zazu buyback prototype. Public claims must match deployed contract state and verified transactions.

## Identity

**Name:** ZAZU

**Ticker:** $ZAZU

**Core line:** THE STARE THAT BURNS BACK.

**System line:** CREATOR FEES IN. VERIFIED ZAZU OUT.

**Status line before deployment:** AWAITING VERIFIED DEPLOYMENT.

Zazu is the gray tabby cat known for an impossibly serious stare. The brand takes its visual language from the original low-resolution elemental edits: earth green, grayscale void, underwater blue, and fire red. It should feel like a cursed image archive crossed with a public terminal.

Do not smooth the art into a glossy mascot system. Keep the hard white dividers, JPEG texture, pixel edges, uncanny stretching, blown-out color tints, blurred backgrounds, terminal labels, and small neon-yellow status accents.

## Core website copy

### Hero

**$ZAZU**

**THE STARE THAT BURNS BACK.**

Creator fees collect in one public vault. A locked-down keeper buys ZAZU when execution is safe, then routes every purchased token to the configured on-chain destination.

**Eligible every 15 minutes.** A cycle is skipped when fees, liquidity, slippage, price impact, gas, or network conditions are unsafe.

### Public terminal

**WATCH THE VAULT. VERIFY THE LOOP.**

No fake countdown. No manually entered total. The timer derives from `lastExecutionTime`, and the ledger derives from `BuybackExecuted` events.

### Mechanism

1. **FEES LAND**

   Creator fees accumulate in the public BuybackVault as the native gas asset or one configured ERC-20.

2. **KEEPER CHECKS**

   The keeper checks every minute. A buyback becomes eligible only after 15 minutes and above the minimum treasury balance.

3. **ROUTER QUOTED**

   The keeper validates a current DEX quote, rejects excessive price impact, and simulates the narrow call through a verified DEX adapter.

4. **ZAZU MOVES**

   Purchased ZAZU goes to the configured burn address, rewards vault, or locked treasury. The exact destination and event stay public.

### Safety

**SAFETY BEFORE CADENCE.**

A buyback may be eligible every 15 minutes. It is never promised to execute exactly every 15 minutes.

Short safety labels:

- KEEPER CANNOT WITHDRAW
- STRICT MAXIMUM BUY SIZE
- NONZERO MINIMUM OUTPUT
- PRICE IMPACT CEILING
- SIMULATION BEFORE SUBMIT
- 15 MINIMUM MINUTES BETWEEN EXECUTIONS
- PAUSABLE BY MULTISIG OWNER
- TIMELOCK OPTION FOR ROUTER AND DESTINATION

## Approved cadence language

Use:

- Eligible every 15 minutes.
- The keeper checks once per minute.
- Execution occurs only when every safety check passes.
- Unsafe cycles are skipped.
- The next eligible time is derived from contract state.
- Buybacks target a minimum 15-minute separation, not a fixed schedule.

Do not use:

- Burns every 15 minutes.
- Guaranteed buyback every 15 minutes.
- Automatic profit loop.
- The timer proves a transaction will happen.
- Buyback happening in 15:00.

The contract cannot trigger itself. The keeper must call it. The 15-minute interval only blocks calls that arrive too early.

## Approved destination language

Use the exact destination type shown by the deployed configuration:

- **burn address** only when the destination is demonstrably irrecoverable;
- **locked treasury** only when the lock contract, owner, and unlock conditions are public;
- **rewards vault** only when distribution rules are public;
- **configured destination** when no stronger claim has been proven.

Do not call every buyback a burn by default. Buying ZAZU and transferring it to a recoverable wallet does not burn supply.

## Pre-deployment X bio

$ZAZU. The stare that burns back. Public BuybackVault prototype for Robinhood Chain. Eligible every 15 minutes, executed only when safety checks pass. Addresses pending verification.

## Post-deployment X bio template

$ZAZU. Creator fees in, verified ZAZU out. Public vault, bounded keeper, contract-derived ledger. Built for Robinhood Chain. CA: [VERIFIED TOKEN LINK]

Use the post-deployment version only after the token, vault, explorer, and destination are public and verified.

## Launch thesis post

Zazu has stared through every timeline and every market.

Now the loop is public.

Creator fees enter a verified BuybackVault. A restricted keeper checks quotes, price impact, slippage, gas, and simulation. Eligible after 15 minutes. Skipped when conditions are unsafe. Every completed execution emits an on-chain receipt.

No fake countdown. No manual total. Verify the vault, destination, and history yourself.

$ZAZU. THE STARE THAT BURNS BACK.

Add token, vault, explorer, API, and first-execution links before publishing this post.

## Pons launch description template

$ZAZU brings the internet's most serious stare to a transparent creator-fee buyback system. Creator fees are intended to enter a public BuybackVault. A bounded keeper may execute after the 15-minute minimum interval only when quote, impact, slippage, simulation, gas, and treasury checks pass. Purchased ZAZU is forwarded to the published destination, and every completed execution is recorded on-chain. Community prototype. Not affiliated with Zazu's owner, Robinhood, Pons, or any DEX.

Do not publish this description until the actual Pons fee path to the vault has been tested and documented.

## X community bio

Public verification hub for $ZAZU. Contract state, buyback receipts, elemental Zazu files, and safety-first execution updates. Community-run and independent.

## Transaction post template

BUYBACK VERIFIED.

- Execution: #[ID]
- Input: [AMOUNT] [ASSET]
- ZAZU purchased: [AMOUNT]
- Destination: [ADDRESS OR LABEL]
- Transaction: [EXPLORER LINK]
- Next eligible time: [CHAIN-DERIVED TIMESTAMP]

Eligibility is not a promise of execution. The next cycle runs only if every safety check passes.

Never post a manually calculated total when the contract getter or event ledger can be linked instead.

## Skipped-cycle post template

KEEPER CHECK COMPLETE. NO EXECUTION.

Reason: [TREASURY BELOW MINIMUM | INTERVAL NOT ELAPSED | QUOTE UNAVAILABLE | PRICE IMPACT | SIMULATION | GAS | RPC | PAUSED | CONFIGURATION MISMATCH]

Funds remain in the public vault. The keeper will check again. No transaction means no buyback claim.

## Registry labels

- ZAZU TOKEN
- BUYBACK VAULT
- FEE ASSET
- DEX ADAPTER
- UNDERLYING DEX ROUTER
- WRAPPED NATIVE TOKEN
- KEEPER
- DESTINATION
- MULTISIG OWNER
- CONFIGURATION TIMELOCK
- DEPLOYMENT BLOCK
- CHAIN ID

Before deployment, use **NOT DEPLOYED**, **NOT CONFIGURED**, or **AWAITING VERIFIED DEPLOYMENT**. Never insert placeholder hexadecimal addresses that look real.

## Public verification copy

**VERIFY, DO NOT TRUST.**

The public terminal reads the configured RPC. Treasury balance and cumulative totals come from vault getters. History rows come from `BuybackExecuted` logs. Explorer links point to the exact transaction. If an event does not exist, the site does not create a row.

## Claims guardrail

Never say:

- powered by Robinhood;
- endorsed by Robinhood;
- listed on Robinhood;
- Pons automatically burns ZAZU;
- 100% of fees are burned, unless the actual fee route and irrecoverable destination prove it;
- audited, unless a named independent audit is published;
- trustless;
- risk-free;
- guaranteed;
- fixed APY, floor, price support, or profit;
- live on mainnet while addresses are blank;
- on-chain when the value is manually entered.

Safe phrasing before verified deployment:

- built for Robinhood Chain;
- intended to route creator fees through a public vault;
- public prototype;
- deployment addresses pending verification;
- Pons is the intended launch path;
- eligible every 15 minutes;
- contract-derived after deployment.

## Social links

Use only confirmed accounts:

- Zazu Instagram: `https://www.instagram.com/zazubabyman/`
- Zazu TikTok: `https://www.tiktok.com/@zazubabyman_`
- Zazu link hub: `https://linktr.ee/zazu_cat`

The project X URL must remain unset until the project account is confirmed.

## Asset registry

- Primary logo and hero image: `public/zazu-logo.jpg`
- Header avatar: `public/zazu-avatar.png`
- Elemental reference panel: `public/zazu-elements.jpg`
- Forty-file archive: `public/zazu-40-grid.png`
- Browser icon: `public/zazu-favicon.png`
- Apple touch icon: `public/zazu-apple-touch-icon.png`
- Social card: `public/og.png`

Keep each tile square, but preserve the deliberately stretched, blurry, compressed elemental look. The rough early-internet distortion is part of the identity, not a defect to polish away.

## Required disclaimer

$ZAZU is a community meme-token prototype and can lose all value. Nothing published by the project is financial advice. The project is independent and is not affiliated with or endorsed by Robinhood, Pons, any DEX, or Zazu's owner.
