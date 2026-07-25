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
    copy: "Trading fees accumulate in the public care wallet.",
  },
  {
    status: "contacting",
    title: "Contact",
    copy: "We are reaching out to Tutu’s owner through TikTok and every channel we can find.",
  },
  {
    status: "responded",
    title: "Response",
    copy: "Owner responds, we verify it’s really them, and coordinate the handoff.",
  },
  {
    status: "donated",
    title: "Donate",
    copy: "100% delivered, receipts posted, video proof.",
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
        <a className="brand" href="#top" aria-label="Tutu home">
          <span className="brand-avatar">
            <Image
              src="/favicon.png"
              alt=""
              width={42}
              height={42}
              priority
            />
          </span>
          <span className="brand-name">TUTU</span>
          <span className="brand-tag">DINO CAT</span>
        </a>

        <nav className="header-center" aria-label="Main navigation">
          <a href="#mission">How it works</a>
          <a href="#goal">Donations</a>
          <a href="#socials">Socials</a>
          <a href="#how-to-buy">How to buy</a>
        </nav>

        <div className="header-actions">
          {CAMPAIGN.xUrl && (
            <SocialLink
              className="header-social"
              href={CAMPAIGN.xUrl}
              label="X"
            />
          )}
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
            <span aria-hidden="true">●</span> THE INTERNET’S TWO-LEGGED HERO
          </p>
          <h1>
            MEET <span>TUTU.</span>
            <br />
            THE DINO CAT.
          </h1>
          <p className="hero-dek">
            Two back legs. One giant heart. Zero quit. Tutu turned a difficult
            start into a story millions can’t stop cheering for.
          </p>
          <p className="hero-mission">
            The internet’s most famous pawless cat. All fees donated to help{" "}
            <strong>$TUTU</strong> live a better life.
          </p>
          <p className="hero-goal-copy">
            We’re raising {usd.format(CAMPAIGN.goalUsd)} for Tutu. 100% of
            trading fees. Then we hand it to his owner, publicly.
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
            {CAMPAIGN.pumpUrl ? (
              <a
                className="button button-primary"
                href={CAMPAIGN.pumpUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buy $TUTU <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="button button-primary button-disabled">
                Buy $TUTU soon
              </span>
            )}
            <a className="progress-pill" href="#goal">
              <strong>{usd.format(raised)}</strong> raised of{" "}
              {usd.format(CAMPAIGN.goalUsd)}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Tutu the Dino Cat">
          <div className="sunburst" aria-hidden="true" />
          <div className="photo-frame">
            <Image
              src="/tutu-hero.jpg"
              alt="Tutu, the two-legged Dino Cat, looking into the camera"
              fill
              priority
              sizes="(max-width: 820px) 92vw, 46vw"
            />
          </div>
          <div className="sticker sticker-fees">
            <strong>100%</strong>
            <span>FEES TO TUTU</span>
          </div>
          <div className="sticker sticker-energy">
            <span>SMALL CAT.</span>
            <strong>JURASSIC ENERGY.</strong>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Tutu’s TikTok stats">
        <div className="stat">
          <strong>464K+</strong>
          <span>TikTok followers</span>
        </div>
        <div className="stat">
          <strong>17.9M</strong>
          <span>TikTok likes</span>
        </div>
        <div className="stat">
          <strong>532</strong>
          <span>Videos &amp; counting</span>
        </div>
        <p className="stats-note">Public TikTok stats · July 24, 2026</p>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>TUTU THE DINO CAT</span>
          <b>✦</b>
          <span>100% OF FEES → TUTU</span>
          <b>✦</b>
          <span>GOAL: $10,000</span>
          <b>✦</b>
          <span>OPERATION: REACH THE OWNER</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
          <span>TUTU THE DINO CAT</span>
          <b>✦</b>
          <span>100% OF FEES → TUTU</span>
          <b>✦</b>
          <span>GOAL: $10,000</span>
          <b>✦</b>
          <span>OPERATION: REACH THE OWNER</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
        </div>
      </div>

      <div className="brand-banner section-shell">
        <Image
          src="/tutu-banner.jpg"
          alt="Tutu the Dino Cat"
          width={1600}
          height={532}
          sizes="(max-width: 1440px) 94vw, 1312px"
        />
      </div>

      <section className="story section-shell" id="story" data-reveal>
        <div className="section-label">
          <span>01</span>
          <p>THE STORY</p>
        </div>
        <div className="story-copy">
          <h2>HE DOESN’T NEED FOUR LEGS TO RUN THE INTERNET.</h2>
          <div className="story-columns">
            <p>
              After losing both front legs, Tutu learned to move through life
              on his own terms, hopping, balancing, climbing, and charming
              absolutely everyone along the way.
            </p>
            <p>
              His tiny T-Rex stance earned him the name “Dino Cat.” His
              resilience earned something bigger: a fast-growing global
              community that shows up for every wobble, zoomie, and victory.
            </p>
          </div>
        </div>
        <aside className="story-card">
          <span className="tiny-pill">WHY TUTU?</span>
          <p>
            <strong>Tutu is his real name.</strong> He is the cat, the mission,
            and the whole reason this community exists.
          </p>
          <span className="dino-mark" aria-hidden="true">
            T
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
            <h2>{usd.format(CAMPAIGN.goalUsd)} FOR TUTU. EVERY TRADE COUNTS.</h2>
            <CampaignProgress
              raisedUsd={raised}
              goalUsd={CAMPAIGN.goalUsd}
            />
            <div className="wallet-proof">
              <p>
                Every fee from every trade goes here. Verify it yourself:
              </p>
              {CAMPAIGN.careWallet ? (
                <a
                  href={`https://solscan.io/account/${encodeURIComponent(
                    CAMPAIGN.careWallet,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Care wallet ↗
                </a>
              ) : (
                <span>Care wallet publishes at launch</span>
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
              <span aria-hidden="true">●</span> OPERATION: REACH THE OWNER
            </p>
            <h2>RAISE IT. VERIFY THEM. HAND IT TO TUTU.</h2>
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
            <p>THE TUTU PROMISE</p>
          </div>
          <p className="eyebrow light">
            <span aria-hidden="true">●</span> THE TUTU PROMISE
          </p>
          <div className="promise-grid">
            <div className="hundred">
              <span>100</span>
              <b>%</b>
            </div>
            <div className="promise-copy">
              <h2>OF FEES GO TOWARD GIVING TUTU A BETTER LIFE.</h2>
              <p>
                Care, comfort, food, play, and all the little things that help
                the internet’s favorite Dino Cat keep living big.
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
              <p>Open Pump.fun and paste the official Tutu contract address.</p>
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
              <span aria-hidden="true">●</span> FOLLOW THE REAL TUTU
            </p>
            <h2>ONE DINO CAT. A VERY LARGE INTERNET.</h2>
            <div className="social-grid">
              <a
                className="social-card social-card-featured"
                href={CAMPAIGN.tiktokUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>TikTok</span>
                  <strong>@dinocattutu ↗</strong>
                </div>
                <dl>
                  <div>
                    <dt>Followers</dt>
                    <dd>464K+</dd>
                  </div>
                  <div>
                    <dt>Likes</dt>
                    <dd>17.9M</dd>
                  </div>
                  <div>
                    <dt>Videos</dt>
                    <dd>532</dd>
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
                  <strong>@dinocattutu ↗</strong>
                </div>
                <p>More daily Tutu, more tiny T-Rex energy.</p>
              </a>
              {CAMPAIGN.xUrl && (
                <a
                  className="social-card"
                  href={CAMPAIGN.xUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <span>X</span>
                    <strong>Campaign updates ↗</strong>
                  </div>
                  <p>Thermometer moves, owner outreach, and public receipts.</p>
                </a>
              )}
              {CAMPAIGN.telegramUrl && (
                <a
                  className="social-card"
                  href={CAMPAIGN.telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <span>Telegram</span>
                    <strong>Join the community ↗</strong>
                  </div>
                  <p>The Tutu mission control room.</p>
                </a>
              )}
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
                  <h2>THE TUTU CHART.</h2>
                </div>
                <a href={fullChartUrl} target="_blank" rel="noreferrer">
                  Open full chart ↗
                </a>
              </div>
              <div className="chart-frame">
                <iframe
                  title="Tutu DexScreener chart"
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
          <h2>MAKE THE INTERNET’S FAVORITE DINO CAT PROUD.</h2>
        </div>
        <a
          className="round-link"
          href="#goal"
          aria-label="View Tutu’s donation goal"
        >
          <span>DONATE</span>
          <strong aria-hidden="true">↓</strong>
        </a>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Image src="/favicon.png" alt="" width={38} height={38} />
            <strong>TUTU THE DINO CAT</strong>
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
            {CAMPAIGN.xUrl && <SocialLink href={CAMPAIGN.xUrl} label="X" />}
            {CAMPAIGN.telegramUrl && (
              <SocialLink href={CAMPAIGN.telegramUrl} label="Telegram" />
            )}
          </div>
        </div>
        <div className="footer-legal">
          <p>
            Tutu is a community meme coin, not an investment product. Crypto is
            volatile. Nothing here is financial advice.
          </p>
          <p>
            Tutu is a community-run fan project. Not affiliated with Tutu’s
            owner yet. We’re working on it.
          </p>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </footer>
    </main>
  );
}
