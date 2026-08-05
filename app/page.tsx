import Image from "next/image";
import { BurnDashboard } from "@/components/BurnDashboard";
import { CopyButton } from "@/components/CopyButton";
import { MotionController } from "@/components/MotionController";
import { ZAZU } from "@/lib/zazu";

const mechanicSteps = [
  {
    number: "01",
    title: "FEES LAND",
    copy: "ZAZU's creator-fee share is reserved for the public BuybackVault as native gas token or one configured ERC-20.",
    tone: "green",
  },
  {
    number: "02",
    title: "KEEPER CHECKS",
    copy: "When live, the keeper checks the vault every minute. Buybacks target 15-minute intervals only when fees and the minimum balance are available.",
    tone: "gray",
  },
  {
    number: "03",
    title: "ROUTE QUOTED",
    copy: "Before an execution, the keeper requests a DEX quote, rejects excessive price impact, and simulates a narrow call through the verified DEX adapter.",
    tone: "blue",
  },
  {
    number: "04",
    title: "ZAZU MOVES",
    copy: "Purchased ZAZU goes to the configured permanent burn destination. Once live, every execution and receipt stays public onchain.",
    tone: "red",
  },
] as const;

const safetyRails = [
  "KEEPER CANNOT WITHDRAW",
  "STRICT MAXIMUM BUY SIZE",
  "NONZERO MINIMUM OUTPUT",
  "PRICE IMPACT CEILING",
  "SIMULATION BEFORE SUBMIT",
  "15 MINIMUM MINUTES BETWEEN EXECUTIONS",
  "PAUSABLE BY MULTISIG OWNER",
  "TIMELOCK OPTION FOR ROUTER AND DESTINATION",
] as const;

function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export default function Home() {
  const dashboardConfigured = Boolean(ZAZU.vaultAddress);

  return (
    <main>
      <MotionController />
      <div className="scroll-progress" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Zazu home">
          <span className="brand-avatar">
            <Image src="/zazu-logo.jpg" alt="" width={44} height={44} priority />
          </span>
          <span className="brand-copy"><strong>ZAZU</strong><small>THE STARE ONCHAIN</small></span>
        </a>

        <nav className="header-nav" aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#wall">Zazu files</a>
          <a href="#mechanism">How it works</a>
          <a href="#security">Security</a>
        </nav>

        <div className="header-actions">
          {ZAZU.xUrl ? <ExternalLink className="header-chip" href={ZAZU.xUrl}>X ↗</ExternalLink> : <span className="header-chip header-chip-muted">X SOON</span>}
          {ZAZU.tokenAddress ? (
            <div className="header-ca"><code>{`${ZAZU.tokenAddress.slice(0, 5)}...${ZAZU.tokenAddress.slice(-4)}`}</code><CopyButton value={ZAZU.tokenAddress} compact /></div>
          ) : <span className="header-chip header-chip-neon">CA SOON</span>}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><i /> BUILT ON ROBINHOOD CHAIN • LAUNCHING THROUGH PONS</p>
          <div className="network-line"><span>CHAIN {ZAZU.chainId}</span><b>•</b><span>15 MIN TARGET</span><b>•</b><span>PUBLIC PROOF</span></div>
          <h1><span>$</span>ZAZU</h1>
          <p className="hero-title">THE STARE THAT<br />BURNS BACK.</p>
          <p className="hero-dek">
            ZAZU&apos;s creator-fee share is reserved for recurring buybacks and permanent burns. Once live, the public vault and keeper route purchased ZAZU to the configured burn destination when execution is safe.
          </p>
          <p className="eligibility-note">
            <strong>Targeting 15-minute intervals when fees are available.</strong> A cycle is skipped when liquidity, slippage, price impact, gas, or network conditions are unsafe.
          </p>

          <div className={`contract-bar${ZAZU.tokenAddress ? "" : " contract-bar-soon"}`}>
            <span>CONTRACT</span>
            {ZAZU.tokenAddress ? <><code>{ZAZU.tokenAddress}</code><CopyButton value={ZAZU.tokenAddress} /></> : <strong>AWAITING VERIFIED DEPLOYMENT</strong>}
          </div>

          <div className="hero-actions">
            <a className="button button-neon" href="#dashboard">OPEN LIVE DATA ↓</a>
            {ZAZU.dexUrl ? <ExternalLink className="button button-dark" href={ZAZU.dexUrl}>TRADE ZAZU ↗</ExternalLink> : <a className="button button-outline" href="#registry">CONTRACT REGISTRY</a>}
          </div>
        </div>

        <div className="hero-art" aria-label="Zazu the gray tabby cat">
          <div className="hero-window">
            <div className="window-title"><span>ZAZU_ELEMENTS.JPG</span><span>_ □ ×</span></div>
            <div className="hero-photo">
              <Image
                src="/zazu-elements.jpg"
                alt="Four lo-fi elemental Zazu cat edits in green, gray, underwater blue, and fire red"
                fill
                priority
                sizes="(max-width: 820px) 92vw, 46vw"
              />
            </div>
          </div>
          <div className="hero-stamp stamp-green">KEEPER<br />TARGET 1M</div>
          <div className="hero-stamp stamp-red">NO HIDDEN<br />TRANSACTIONS</div>
          <div className="pixel-note">FOUR ELEMENTS. ONE STARE.<br />JPEG QUALITY: DESTROYED.</div>
        </div>
      </section>

      <div className="element-strip" aria-hidden="true"><span>EARTH</span><span>VOID</span><span>WATER</span><span>FIRE</span></div>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>CREATOR FEES IN</span><b>✦</b><span>QUOTE CHECKED</span><b>✦</b><span>SIMULATION PASSED</span><b>✦</b><span>ZAZU BOUGHT</span><b>✦</b><span>DESTINATION VERIFIED</span><b>✦</b>
          <span>CREATOR FEES IN</span><b>✦</b><span>QUOTE CHECKED</span><b>✦</b><span>SIMULATION PASSED</span><b>✦</b><span>ZAZU BOUGHT</span><b>✦</b><span>DESTINATION VERIFIED</span><b>✦</b>
        </div>
      </div>

      <section className="dashboard-section" id="dashboard" data-reveal>
        <div className="section-shell">
          <div className="section-kicker"><span>01</span><p>PUBLIC BUYBACK TERMINAL</p></div>
          <div className="section-heading dashboard-heading">
            <div><p className="eyebrow eyebrow-light"><i /> CONTRACT-DERIVED DATA ONLY</p><h2>WATCH THE VAULT.<br />VERIFY THE LOOP.</h2></div>
            <p>No fake countdown and no manually entered burn total. Once configured, the timer derives from lastExecutionTime and the ledger derives from BuybackExecuted events.</p>
          </div>
          <BurnDashboard
            configured={dashboardConfigured}
            vaultAddress={ZAZU.vaultAddress}
            explorerUrl={ZAZU.explorerBase}
          />
        </div>
      </section>

      <section className="wall-section" id="wall" data-reveal>
        <div className="section-shell">
          <div className="section-kicker"><span>02</span><p>ZAZU FILE ARCHIVE</p></div>
          <div className="section-heading wall-heading">
            <div><p className="eyebrow"><i /> SAME CAT. FORTY CONDITIONS.</p><h2>THE STARE<br />HAS RANGE.</h2></div>
            <p>Forty stretched, blurry, deeply compressed Zazu files. XP hill, grayscale hallway, underwater, fire, lightning, CRT, fog, and other terminal states.</p>
          </div>
          <div className="zazu-grid-window">
            <div className="window-title"><span>ZAZU_VARIANTS_001-040.PNG</span><span>8 × 5</span></div>
            <Image src="/zazu-40-grid.png" alt="Forty intentionally distorted and compressed elemental Zazu cat variations in an eight by five grid" width={1586} height={992} sizes="(max-width: 1440px) 96vw, 1360px" />
            <div className="grid-corner"><strong>40</strong><span>FILES FOUND</span></div>
          </div>
          <div className="original-files">
            <div className="original-image"><Image src="/zazu-elements.jpg" alt="Four early internet elemental Zazu edits" fill sizes="(max-width: 720px) 94vw, 38vw" /></div>
            <div className="original-copy"><span>REFERENCE FOLDER</span><h3>EARTH. VOID.<br />WATER. FIRE.</h3><p>The original cursed four-panel energy, expanded into forty low-resolution ways to stretch Zazu into another dimension.</p></div>
          </div>
        </div>
      </section>

      <section className="mechanism-section" id="mechanism" data-reveal>
        <div className="section-shell">
          <div className="section-kicker"><span>03</span><p>HOW THE LOOP WORKS</p></div>
          <div className="section-heading mechanism-heading">
            <div><p className="eyebrow"><i /> DESIGNED TO BE AUTOMATED, BOUNDED, AUDITABLE</p><h2>FOUR STEPS.<br />ZERO THEATER.</h2></div>
            <p>The contract does not wake itself up. Once live, the keeper checks once per minute and can only invoke the vault&apos;s narrow buyback path.</p>
          </div>
          <div className="mechanic-grid">
            {mechanicSteps.map((step) => <article className={`mechanic-card ${step.tone}`} key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}
          </div>
          <div className="flow-line"><span>CREATOR FEES</span><b>→</b><span>PUBLIC VAULT</span><b>→</b><span>DEX ADAPTER</span><b>→</b><span>ZAZU</span><b>→</b><span>VERIFIED DESTINATION</span></div>
        </div>
      </section>

      <section className="security-section" id="security" data-reveal>
        <div className="section-shell security-layout">
          <div className="security-copy">
            <div className="section-kicker section-kicker-light"><span>04</span><p>EXECUTION GUARDRAILS</p></div>
            <p className="eyebrow eyebrow-light"><i /> SAFETY BEFORE CADENCE</p>
            <h2>SKIP THE BUY<br />BEFORE FORCING<br />A BAD ONE.</h2>
            <p>Buybacks target 15-minute intervals when fees are available. They are never promised to execute exactly every 15 minutes.</p>
          </div>
          <div className="safety-list">
            {safetyRails.map((rail, index) => <div key={rail}><span>{String(index + 1).padStart(2, "0")}</span><strong>{rail}</strong><i>✓</i></div>)}
          </div>
        </div>
      </section>

      <section className="registry-section" id="registry" data-reveal>
        <div className="section-shell">
          <div className="section-kicker"><span>05</span><p>CONTRACT REGISTRY</p></div>
          <div className="registry-layout">
            <div><p className="eyebrow"><i /> VERIFY, DO NOT TRUST</p><h2>PRODUCTION ADDRESSES<br />GO HERE ONLY AFTER<br />TESTNET PROOF.</h2></div>
            <div className="registry-table">
              <div><span>ZAZU TOKEN</span><code>{ZAZU.tokenAddress || "NOT DEPLOYED"}</code>{ZAZU.tokenAddress ? <CopyButton value={ZAZU.tokenAddress} compact /> : null}</div>
              <div><span>BUYBACK VAULT</span><code>{ZAZU.vaultAddress || "NOT DEPLOYED"}</code>{ZAZU.vaultAddress ? <CopyButton value={ZAZU.vaultAddress} compact /> : null}</div>
              <div><span>DEX ADAPTER</span><code>NOT CONFIGURED</code></div>
              <div><span>CHAIN ID</span><code>{ZAZU.chainId}</code></div>
            </div>
          </div>
          <p className="registry-note">No production DEX adapter or underlying router is hardcoded. Testnet deployment, adapter verification, a small-value end-to-end buyback, explorer checks, and multisig ownership transfer come first.</p>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Image src="/zazu-logo.jpg" alt="" width={56} height={56} /><div><strong>ZAZU.EXE</strong><span>STILL STARING AT THE CHAIN.</span></div></div>
          <div className="footer-links">
            {ZAZU.xUrl ? <ExternalLink href={ZAZU.xUrl}>Project X ↗</ExternalLink> : null}
            <ExternalLink href={ZAZU.instagramUrl}>Zazu Instagram ↗</ExternalLink>
            <ExternalLink href={ZAZU.tiktokUrl}>Zazu TikTok ↗</ExternalLink>
            <ExternalLink href={ZAZU.ponsUrl}>Pons ↗</ExternalLink>
            <ExternalLink href={ZAZU.explorerBase}>Explorer ↗</ExternalLink>
          </div>
        </div>
        <div className="footer-legal">
          <p>$ZAZU is a community meme token prototype and can lose all value. Nothing here is financial advice.</p>
          <p>Built on Robinhood Chain and launching through Pons. Not affiliated with or endorsed by Robinhood, Pons, a DEX, or Zazu&apos;s owner.</p>
          <a href="#top">TOP ↑</a>
        </div>
      </footer>
    </main>
  );
}
