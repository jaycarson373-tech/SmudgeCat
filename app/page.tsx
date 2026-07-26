import Image from "next/image";
import { CampaignProgress } from "@/components/CampaignProgress";
import { CopyButton } from "@/components/CopyButton";
import { MotionController } from "@/components/MotionController";
import { CAMPAIGN, type CampaignStatus } from "@/lib/campaign";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const missionSteps: Array<{
  status: CampaignStatus;
  title: string;
  copy: string;
}> = [
  {
    status: "raising",
    title: "Raise",
    copy: "Trading fees accumulate in the public support wallet.",
  },
  {
    status: "contacting",
    title: "Support",
    copy: "Fees fund verified Rigby Cameos and official merch purchases.",
  },
  {
    status: "responded",
    title: "Connect",
    copy: "We keep reaching out through Rigby’s verified channels until we connect with her owner.",
  },
  {
    status: "donated",
    title: "Direct",
    copy: "Once connected, support moves directly to Rigby with public receipts.",
  },
];

function safeAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function shortAddress(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function SocialLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function Home() {
  const raised = safeAmount(CAMPAIGN.raisedUsd);
  const statusIndex = missionSteps.findIndex(
    (step) => step.status === CAMPAIGN.status,
  );
  const chartUrl = `https://dexscreener.com/solana/${encodeURIComponent(
    CAMPAIGN.ca,
  )}`;
  const fullChartUrl = CAMPAIGN.dexscreenerUrl || chartUrl;

  return (
    <main>
      <MotionController />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Rigby home">
          <span className="brand-avatar">
            <Image
              src="/rigby-avatar.png"
              alt=""
              width={42}
              height={42}
              priority
            />
          </span>
          <span className="brand-name">RIGBY</span>
          <span className="brand-tag">BLEP CAT</span>
        </a>

        <nav className="header-center" aria-label="Main navigation">
          <a href="#mission">How it works</a>
          <a href="#goal">Donations</a>
          <a href="#socials">Socials</a>
          <a href="#how-to-buy">How to buy</a>
        </nav>

        <div className="header-actions">
          <SocialLink
            className="header-social"
            href={CAMPAIGN.instagramUrl}
            label="IG"
          />
          <SocialLink
            className="header-social tiktok-social"
            href={CAMPAIGN.tiktokUrl}
            label="TK"
          />
          <div className="header-ca" aria-label="Contract address">
            {CAMPAIGN.ca ? (
              <>
                <code>{shortAddress(CAMPAIGN.ca)}</code>
                <CopyButton value={CAMPAIGN.ca} compact />
              </>
            ) : (
              <a href="#how-to-buy">CA DROPS SOON</a>
            )}
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true">●</span> ONE OF THE WORLD’S MOST VIRAL CATS
          </p>
          <h1>
            MEET <span>RIGBY.</span>
            <br />
            THE FAINTING GOAT CAT.
          </h1>
          <p className="hero-dek">
            Big eyes. Tiny blep. Nearly 3 million TikTok followers. Rigby turned
            one unforgettable face into a global internet obsession.
          </p>
          <p className="hero-mission">
            The internet’s favorite fainting goat cat deserves to run on Solana.{" "}
            <strong>$RIGBY</strong> sends every fee back toward supporting her.
          </p>
          <p className="hero-goal-copy">
            For now, 100% of trading fees support Rigby through verified Cameos
            and official merch. Direct owner support comes next.
          </p>

          <div className={`ca-bar${CAMPAIGN.ca ? "" : " ca-bar-soon"}`}>
            <span>Contract</span>
            {CAMPAIGN.ca ? (
              <>
                <code className="ca-full">{CAMPAIGN.ca}</code>
                <code className="ca-short">
                  {shortAddress(CAMPAIGN.ca)}
                </code>
                <CopyButton value={CAMPAIGN.ca} />
              </>
            ) : (
              <strong>CA DROPS SOON</strong>
            )}
          </div>

          <div className="hero-actions">
            {CAMPAIGN.jupiterUrl ? (
              <a
                className="button button-primary"
                href={CAMPAIGN.jupiterUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buy $RIGBY <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="button button-primary button-disabled">
                Buy $RIGBY soon
              </span>
            )}
            <a className="progress-pill" href="#goal">
              <strong>{usd.format(raised)}</strong> raised of{" "}
              {usd.format(CAMPAIGN.goalUsd)}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Rigby the viral cat">
          <div className="sunburst" aria-hidden="true" />
          <div className="photo-frame">
            <Image
              src="/rigby-hero.jpg"
              alt="Rigby, the gray and white viral cat, making her signature tongue-out face"
              fill
              priority
              sizes="(max-width: 820px) 92vw, 46vw"
            />
          </div>
          <div className="sticker sticker-fees">
            <strong>100%</strong>
            <span>FEES SUPPORT RIGBY</span>
          </div>
          <div className="sticker sticker-energy">
            <span>TINY BLEP.</span>
            <strong>GLOBAL MEME.</strong>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Rigby’s social media stats">
        <div className="stat">
          <strong>2.8M</strong>
          <span>TikTok followers</span>
        </div>
        <div className="stat">
          <strong>2.35M+</strong>
          <span>Instagram followers</span>
        </div>
        <div className="stat">
          <strong>346M+</strong>
          <span>Views on one TikTok</span>
        </div>
        <p className="stats-note">Public social stats · July 2026</p>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>RIGBY THE BLEP CAT</span>
          <b>✦</b>
          <span>100% OF FEES SUPPORT RIGBY</span>
          <b>✦</b>
          <span>GOAL: $10,000</span>
          <b>✦</b>
          <span>CAMEOS + OFFICIAL MERCH</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
          <span>RIGBY THE BLEP CAT</span>
          <b>✦</b>
          <span>100% OF FEES SUPPORT RIGBY</span>
          <b>✦</b>
          <span>GOAL: $10,000</span>
          <b>✦</b>
          <span>CAMEOS + OFFICIAL MERCH</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
        </div>
      </div>

      <div className="brand-banner section-shell">
        <Image
          src="/rigby-og.png"
          alt="Rigby, the fainting goat cat"
          width={1731}
          height={909}
          sizes="(max-width: 1440px) 94vw, 1312px"
        />
      </div>

      <section className="story section-shell" id="story" data-reveal>
        <div className="section-label">
          <span>01</span>
          <p>THE STORY</p>
        </div>
        <div className="story-copy">
          <h2>SHE MADE ONE SILLY FACE. THE INTERNET NEVER RECOVERED.</h2>
          <div className="story-columns">
            <p>
              Rigby has myotonia congenita, a rare muscle condition sometimes
              nicknamed “fainting goat syndrome.” Her muscles can stay
              contracted after movement, creating stiffness and her famously
              expressive tongue-out look.
            </p>
            <p>
              She is not actually fainting. She remains conscious, keeps being
              completely herself, and has become a confirmed reaction-meme icon
              loved across TikTok, Instagram, and the wider internet.
            </p>
          </div>
        </div>
        <aside className="story-card">
          <span className="tiny-pill">WHY RIGBY?</span>
          <p>
            <strong>She is already internet history.</strong> Nearly 3 million
            TikTok followers, more than 2.3 million on Instagram, and a
            346-million-view breakout video.
          </p>
          <span className="rigby-mark" aria-hidden="true">
            R
          </span>
        </aside>
      </section>

      <section
        className="goal-section campaign-section"
        id="goal"
        data-reveal
      >
        <div className="section-shell campaign-grid">
          <div className="section-label">
            <span>02</span>
            <p>THE GOAL</p>
          </div>
          <div className="campaign-main">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> THE THERMOMETER
            </p>
            <h2>
              {usd.format(CAMPAIGN.goalUsd)} FOR RIGBY. EVERY TRADE COUNTS.
            </h2>
            <CampaignProgress
              raisedUsd={raised}
              goalUsd={CAMPAIGN.goalUsd}
            />
            <div className="wallet-proof">
              <p>
                Every fee from every trade supports the Rigby mission:
              </p>
              {CAMPAIGN.careWallet ? (
                <a
                  href={`https://solscan.io/account/${encodeURIComponent(
                    CAMPAIGN.careWallet,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Support wallet ↗
                </a>
              ) : (
                <span>Support wallet publishes at launch</span>
              )}
              <strong>Total updated regularly. On-chain doesn’t lie.</strong>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mission-section campaign-section"
        id="mission"
        data-reveal
      >
        <div className="section-shell campaign-grid">
          <div className="section-label">
            <span>03</span>
            <p>THE MISSION</p>
          </div>
          <div className="campaign-main">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> OPERATION: SUPPORT RIGBY
            </p>
            <h2>RAISE IT. SUPPORT HER. SHOW THE RECEIPTS.</h2>
            <div className="mission-timeline">
              {missionSteps.map((step, index) => {
                const state =
                  index < statusIndex
                    ? "completed"
                    : index === statusIndex
                      ? "active"
                      : "future";

                return (
                  <div className={`mission-step ${state}`} key={step.status}>
                    <div className="mission-node" aria-hidden="true">
                      {state === "completed" ? "✓" : <i />}
                    </div>
                    <div>
                      <span>0{index + 1}</span>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="promise" id="promise" data-reveal>
        <div className="promise-inner">
          <div className="promise-number">
            <span>04</span>
            <p>THE RIGBY PROMISE</p>
          </div>
          <p className="eyebrow light">
            <span aria-hidden="true">●</span> THE RIGBY PROMISE
          </p>
          <div className="promise-grid">
            <div className="hundred">
              <span>100</span>
              <b>%</b>
            </div>
            <div className="promise-copy">
              <h2>OF FEES GO BACK TOWARD SUPPORTING RIGBY.</h2>
              <p>
                For now, that means official Cameo bookings and merch purchases
                through Rigby’s verified channels. Once we connect with her
                owner, the mission moves to direct, publicly documented support.
              </p>
              <a className="promise-goal-link" href="#goal">
                First stop: {usd.format(CAMPAIGN.goalUsd)}. Track it live ↑
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        className="how-to-buy campaign-section section-shell"
        id="how-to-buy"
        data-reveal
      >
        <div className="section-label">
          <span>05</span>
          <p>HOW TO BUY</p>
        </div>
        <div className="campaign-main">
          <p className="eyebrow">
            <span aria-hidden="true">●</span> JOIN THE MISSION
          </p>
          <h2>THREE STEPS. ONE VERY GOOD CAT.</h2>
          <div className="buy-steps">
            <article>
              <span>01</span>
              <h3>Phantom + SOL</h3>
              <p>Download Phantom, create a wallet, and add a little SOL.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Paste the CA</h3>
              <p>
                Open Jupiter or Pump.fun and paste the official Rigby contract
                address.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Swap</h3>
              <p>Choose your amount, confirm the swap, and join the mission.</p>
            </article>
          </div>
          <div className={`ca-bar buy-ca${CAMPAIGN.ca ? "" : " ca-bar-soon"}`}>
            <span>Official CA</span>
            {CAMPAIGN.ca ? (
              <>
                <code className="ca-full">{CAMPAIGN.ca}</code>
                <code className="ca-short">
                  {shortAddress(CAMPAIGN.ca)}
                </code>
                <CopyButton value={CAMPAIGN.ca} />
              </>
            ) : (
              <strong>CA DROPS SOON</strong>
            )}
          </div>
          <p className="buy-close">Every buy moves the thermometer.</p>
        </div>
      </section>

      <section
        className="socials-section campaign-section"
        id="socials"
        data-reveal
      >
        <div className="section-shell campaign-grid">
          <div className="section-label">
            <span>06</span>
            <p>SOCIALS</p>
          </div>
          <div className="campaign-main">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> FOLLOW THE REAL RIGBY
            </p>
            <h2>ONE SILLY CAT. A VERY LARGE INTERNET.</h2>
            <div className="social-grid">
              <a
                className="social-card social-card-featured"
                href={CAMPAIGN.tiktokUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>TikTok</span>
                  <strong>@iamrigbycat ↗</strong>
                </div>
                <dl>
                  <div>
                    <dt>Followers</dt>
                    <dd>2.8M</dd>
                  </div>
                  <div>
                    <dt>Top video</dt>
                    <dd>346M+</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>Growing</dd>
                  </div>
                </dl>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Instagram</span>
                  <strong>@iamrigbycat ↗</strong>
                </div>
                <p>More than 2.3 million followers and growing.</p>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.cameoUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Cameo</span>
                  <strong>Book Rigby ↗</strong>
                </div>
                <p>One of the verified ways fees support Rigby right now.</p>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.merchUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Official merch</span>
                  <strong>Shop Rigby + Simba ↗</strong>
                </div>
                <p>Buy directly through Rigby’s official store.</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {CAMPAIGN.ca && (
        <section className="chart-section campaign-section" data-reveal>
          <div className="section-shell campaign-grid">
            <div className="section-label">
              <span>07</span>
              <p>THE CHART</p>
            </div>
            <div className="campaign-main">
              <div className="chart-heading">
                <div>
                  <p className="eyebrow">
                    <span aria-hidden="true">●</span> LIVE ON-CHAIN
                  </p>
                  <h2>THE RIGBY CHART.</h2>
                </div>
                <a href={fullChartUrl} target="_blank" rel="noreferrer">
                  Open full chart ↗
                </a>
              </div>
              <div className="chart-frame">
                <iframe
                  title="Rigby DexScreener chart"
                  src={`${chartUrl}?embed=1&theme=dark&trades=0&info=0`}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="final-cta section-shell" data-reveal>
        <div>
          <p className="eyebrow">
            <span aria-hidden="true">●</span> CHARITY COIN. MEME COIN ENERGY.
          </p>
          <h2>PUT THE INTERNET’S FAVORITE BLEP ON SOLANA.</h2>
        </div>
        <a
          className="round-link"
          href="#goal"
          aria-label="View Rigby’s support goal"
        >
          <span>DONATE</span>
          <strong aria-hidden="true">↓</strong>
        </a>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Image src="/rigby-avatar.png" alt="" width={38} height={38} />
            <strong>RIGBY THE FAINTING GOAT CAT</strong>
          </div>
          <div className={`footer-ca${CAMPAIGN.ca ? "" : " footer-ca-soon"}`}>
            <span>CA</span>
            {CAMPAIGN.ca ? (
              <>
                <code>{shortAddress(CAMPAIGN.ca)}</code>
                <CopyButton value={CAMPAIGN.ca} compact />
              </>
            ) : (
              <strong>DROPS SOON</strong>
            )}
          </div>
          <div className="footer-socials">
            <SocialLink href={CAMPAIGN.tiktokUrl} label="TikTok" />
            <SocialLink href={CAMPAIGN.instagramUrl} label="Instagram" />
            <SocialLink href={CAMPAIGN.youtubeUrl} label="YouTube" />
            <SocialLink href={CAMPAIGN.cameoUrl} label="Cameo" />
            <SocialLink href={CAMPAIGN.merchUrl} label="Official merch" />
            <SocialLink href={CAMPAIGN.linktreeUrl} label="All Rigby links" />
          </div>
        </div>
        <div className="footer-legal">
          <p>
            Rigby is a community meme coin, not an investment product. Crypto
            is volatile. Nothing here is financial advice.
          </p>
          <p>
            Rigby is a community-run fan project. Not affiliated with Rigby’s
            owner. Fees support her through official Cameos and merch for now.
          </p>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
        {CAMPAIGN.ca &&
          CAMPAIGN.jupiterUrl &&
          CAMPAIGN.pumpUrl &&
          CAMPAIGN.dexscreenerUrl && (
            <nav
              className="footer-market-links"
              aria-label="Buy and chart links"
            >
              <SocialLink
                className="footer-buy-link"
                href={CAMPAIGN.jupiterUrl}
                label="BUY $RIGBY ON JUPITER"
              />
              <SocialLink href={CAMPAIGN.pumpUrl} label="PUMP.FUN" />
              <SocialLink
                href={CAMPAIGN.dexscreenerUrl}
                label="DEXSCREENER"
              />
            </nav>
          )}
      </footer>
    </main>
  );
}
