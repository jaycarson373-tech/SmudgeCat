import Image from "next/image";
import { CampaignProgress } from "@/components/CampaignProgress";
import { MotionController } from "@/components/MotionController";
import { PfpStudio } from "@/components/PfpStudio";
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
    copy: "100% of creator fees are reserved for Smudge and his owner.",
  },
  {
    status: "contacting",
    title: "Connect",
    copy: "The community keeps reaching out through Smudge’s verified official channels.",
  },
  {
    status: "responded",
    title: "Document",
    copy: "Once contact is verified, the handoff plan and every completed contribution are documented.",
  },
  {
    status: "donated",
    title: "Direct",
    copy: "Creator fees are delivered to Smudge’s owner with public receipts.",
  },
];

const greatestHits = [
  {
    rank: "01",
    title: "He no like vegetals",
    metricOneLabel: "Original post",
    metricOne: "2018",
    metricTwoLabel: "Tumblr notes",
    metricTwo: "50K+",
    image: "/smudge-original.jpg",
    alt: "Smudge sitting at the dinner table behind a plate of salad",
    href: "https://www.tumblr.com/deadbeforedeath/175034192749/he-no-like-vegetals",
    linkLabel: "See the original",
  },
  {
    rank: "02",
    title: "Meme of the Year",
    metricOneLabel: "Shorty Award",
    metricOne: "Winner",
    metricTwoLabel: "Year",
    metricTwo: "2020",
    image: "/smudge-kitten.jpg",
    alt: "Smudge investigating a kitchen faucet",
    href: "https://shortyawards.com/12th/woman-yells-at-cat",
    linkLabel: "See the award",
  },
  {
    rank: "03",
    title: "Still judging",
    metricOneLabel: "Instagram",
    metricOne: "1.5M",
    metricTwoLabel: "Posts",
    metricTwo: "685",
    image: "/smudge-collectible.jpg",
    alt: "Smudge, the white table cat, looking into the camera",
    href: "https://www.instagram.com/smudge_lord/",
    linkLabel: "Follow Smudge",
  },
] as const;

const pfpDownloads = [
  {
    title: "Studio Smudge",
    detail: "Clean white",
    image: "/smudge-pfp-studio.png",
  },
  {
    title: "Comic Smudge",
    detail: "Halftone legend",
    image: "/smudge-pfp-comic.png",
  },
  {
    title: "Pixel Smudge",
    detail: "16-bit judgment",
    image: "/smudge-pfp-pixel.png",
  },
  {
    title: "Clay Smudge",
    detail: "Handmade hater",
    image: "/smudge-pfp-clay.png",
  },
] as const;

function safeAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
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

  return (
    <main>
      <MotionController />
      <div className="scroll-progress" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Smudge home">
          <span className="brand-avatar">
            <Image
              src="/smudge-avatar.png"
              alt=""
              width={42}
              height={42}
              priority
            />
          </span>
          <span className="brand-name">SMUDGE</span>
          <span className="brand-tag">TABLE CAT</span>
        </a>

        <nav className="header-center" aria-label="Main navigation">
          <a href="#pfp">PFP studio</a>
          <a href="#hits">Greatest hits</a>
          <a href="#mission">How it works</a>
          <a href="#goal">Donations</a>
          <a href="#socials">Socials</a>
        </nav>

        <div className="header-actions">
          <SocialLink
            className="header-social instagram-social"
            href={CAMPAIGN.instagramUrl}
            label="IG"
          />
          <SocialLink
            className="header-social tiktok-social"
            href={CAMPAIGN.tiktokUrl}
            label="TK"
          />
          <SocialLink
            className="header-social x-social"
            href={CAMPAIGN.xUrl}
            label="X"
          />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true">●</span> ONE OF THE WORLD’S MOST VIRAL CATS
          </p>
          <div className="launch-signal">
            <a href={CAMPAIGN.xUrl} target="_blank" rel="noreferrer">
              Follow @SmudgeLord ↗
            </a>
          </div>
          <h1>
            MEET <span>SMUDGE.</span>
            <br />
            THE TABLE CAT.
          </h1>
          <p className="hero-dek">
            Smudge the Table Cat claimed one seat, faced one plate of
            vegetables, and became one of the defining memes of the internet.
          </p>
          <p className="hero-mission">
            The internet’s most famous salad hater deserves to run on Solana.{" "}
            <strong>$SMUDGE</strong> is meme history with nine lives.
          </p>
          <p className="hero-goal-copy">
            100% of creator fees are reserved for Smudge and his owner, with
            public receipts when funds are delivered.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#pfp">
              MAKE A SMUDGE PFP ↓
            </a>
            <a className="progress-pill" href="#goal">
              <strong>{usd.format(raised)}</strong> raised of{" "}
              {usd.format(CAMPAIGN.goalUsd)}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Smudge the famous table cat">
          <div className="sunburst" aria-hidden="true" />
          <div className="photo-frame">
            <Image
              src="/smudge-original.jpg"
              alt="Smudge, the white viral cat, sitting behind a plate of salad"
              fill
              priority
              sizes="(max-width: 820px) 92vw, 46vw"
            />
          </div>
          <div className="sticker sticker-fees">
            <strong>100%</strong>
            <span>CREATOR FEES FOR SMUDGE</span>
          </div>
          <div className="sticker sticker-energy">
            <span>NO VEGETALS.</span>
            <strong>ONLY MEMES.</strong>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Smudge’s internet legacy">
        <div className="stat">
          <strong>1.5M</strong>
          <span>Instagram followers</span>
        </div>
        <div className="stat">
          <strong>50K+</strong>
          <span>Original Tumblr notes</span>
        </div>
        <div className="stat">
          <strong>#1</strong>
          <span>TIME’s 2020 cat ranking</span>
        </div>
        <p className="stats-note">Public sources · July 2026</p>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>SMUDGE THE TABLE CAT</span>
          <b>✦</b>
          <span>100% OF CREATOR FEES FOR SMUDGE + HIS OWNER</span>
          <b>✦</b>
          <span>BUILD YOUR SMUDGE PFP</span>
          <b>✦</b>
          <span>GOAL: $5,000</span>
          <b>✦</b>
          <span>CHARITY COIN. MEME ENERGY.</span>
          <b>✦</b>
          <span>HE NO LIKE VEGETALS</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
          <span>SMUDGE THE TABLE CAT</span>
          <b>✦</b>
          <span>100% OF CREATOR FEES FOR SMUDGE + HIS OWNER</span>
          <b>✦</b>
          <span>BUILD YOUR SMUDGE PFP</span>
          <b>✦</b>
          <span>GOAL: $5,000</span>
          <b>✦</b>
          <span>CHARITY COIN. MEME ENERGY.</span>
          <b>✦</b>
          <span>HE NO LIKE VEGETALS</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
        </div>
      </div>

      <div className="brand-banner section-shell">
        <Image
          src="/smudge-collectible.jpg"
          alt="Smudge, the famous white table cat"
          width={640}
          height={640}
          sizes="(max-width: 1440px) 94vw, 1312px"
        />
      </div>

      <section className="story section-shell" id="story" data-reveal>
        <div className="section-label">
          <span>01</span>
          <p>THE STORY</p>
        </div>
        <div className="story-copy">
          <h2>HE TOOK ONE SEAT AT THE TABLE. THE INTERNET NEVER RECOVERED.</h2>
          <div className="story-columns">
            <p>
              Smudge the Table Cat is a white rescue cat from Ottawa who
              insists on having a chair at dinner. In June 2018, he claimed an
              empty seat behind a plate of salad and made internet history.
            </p>
            <p>
              The original Tumblr post, “he no like vegetals,” became the cat
              half of “Woman Yelling at a Cat.” The pairing turned Smudge into
              one of the most recognizable reaction images ever made.
            </p>
          </div>
        </div>
        <aside className="story-card">
          <span className="tiny-pill">WHY SMUDGE?</span>
          <p>
            <strong>He is certified internet royalty.</strong> Meme of the Year,
            TIME’s top internet cat of 2020, and 1.5 million Instagram followers.
          </p>
          <span className="smudge-mark" aria-hidden="true">
            S
          </span>
        </aside>
      </section>

      <section className="hits-section campaign-section" id="hits" data-reveal>
        <div className="section-shell hits-shell">
          <div className="section-label">
            <span>02</span>
            <p>GREATEST HITS</p>
          </div>
          <div className="hits-main">
            <div className="hits-heading">
              <div>
                <p className="eyebrow light">
                  <span aria-hidden="true">●</span> INTERNET HISTORY
                </p>
                <h2>SMUDGE’S GREATEST HITS.</h2>
              </div>
              <div className="hits-total">
                <strong>2018</strong>
                <span>the table was claimed</span>
              </div>
            </div>
            <p className="hits-intro">
              One face. Infinite remixes. A permanent seat at the table of
              internet culture.
            </p>
            <div className="hits-grid">
              {greatestHits.map((hit) => (
                <article className="hit-card" key={hit.rank}>
                  <div className="hit-video">
                    <Image
                      src={hit.image}
                      alt={hit.alt}
                      fill
                      sizes="(max-width: 820px) 82vw, 29vw"
                    />
                    <span>{hit.rank}</span>
                  </div>
                  <div className="hit-copy">
                    <h3>{hit.title}</h3>
                    <dl>
                      <div>
                        <dt>{hit.metricOneLabel}</dt>
                        <dd>{hit.metricOne}</dd>
                      </div>
                      <div>
                        <dt>{hit.metricTwoLabel}</dt>
                        <dd>{hit.metricTwo}</dd>
                      </div>
                    </dl>
                    <a href={hit.href} target="_blank" rel="noreferrer">
                      {hit.linkLabel} ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <p className="hits-note">
              Public source totals checked July 2026.
            </p>
          </div>
        </div>
      </section>

      <section className="pfp-section campaign-section" id="pfp" data-reveal>
        <div className="section-shell pfp-shell">
          <div className="section-label">
            <span>03</span>
            <p>PFP STUDIO</p>
          </div>
          <div className="pfp-main">
            <div className="pfp-heading">
              <div>
                <p className="eyebrow">
                  <span aria-hidden="true">●</span> THE SMUDGE MACHINE
                </p>
                <h2>ONE CAT. INFINITE INTERNET.</h2>
              </div>
              <p>
                Pick a Smudge, choose a background, add a hat and dress him for
                dinner. Every PFP downloads as a crisp, circle-safe PNG.
              </p>
            </div>

            <PfpStudio />

            <div className="pfp-download-heading">
              <div>
                <span>READY-MADE PFP PACK</span>
                <h3>DON’T WANT TO BUILD? TAKE ONE.</h3>
              </div>
              <p>Free to download. Built for the timeline.</p>
            </div>
            <div className="pfp-download-grid">
              {pfpDownloads.map((pfp) => (
                <article className="pfp-download-card" key={pfp.title}>
                  <Image
                    src={pfp.image}
                    alt={`${pfp.title} profile picture`}
                    width={1024}
                    height={1024}
                    sizes="(max-width: 580px) 82vw, (max-width: 1000px) 42vw, 21vw"
                  />
                  <div>
                    <span>{pfp.detail}</span>
                    <strong>{pfp.title}</strong>
                    <a href={pfp.image} download>
                      DOWNLOAD PNG ↓
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="bot-card" id="bot">
              <div className="bot-pulse" aria-hidden="true">
                <i />
                BOT
              </div>
              <div>
                <p className="eyebrow">
                  <span aria-hidden="true">●</span> AUTOMATED SMUDGE REPLIES
                </p>
                <h3>TAG THE BOT. GET YOUR PFP SMUDGED.</h3>
                <p>
                  Mention or reply to the Smudge bot on X. It reads the look of
                  your current profile picture, creates a one-of-one Smudge
                  version, and replies with the finished image.
                </p>
              </div>
              {CAMPAIGN.botHandle ? (
                <a
                  href={`https://x.com/${CAMPAIGN.botHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  TAG @{CAMPAIGN.botHandle.replace(/^@/, "")} ↗
                </a>
              ) : (
                <span>BOT HANDLE DROPS AT ACTIVATION</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className="goal-section campaign-section"
        id="goal"
        data-reveal
      >
        <div className="section-shell campaign-grid">
          <div className="section-label">
            <span>04</span>
            <p>THE GOAL</p>
          </div>
          <div className="campaign-main">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> THE THERMOMETER
            </p>
            <h2>
              {usd.format(CAMPAIGN.goalUsd)} FOR SMUDGE AND HIS OWNER. EVERY
              VERIFIED CONTRIBUTION COUNTS.
            </h2>
            <CampaignProgress
              raisedUsd={raised}
              goalUsd={CAMPAIGN.goalUsd}
            />
            <div className="wallet-proof">
              <p>
                Every verified contribution moves this meter.
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
              ) : null}
              <strong>
                Contributions are counted after verification and updated
                publicly.
              </strong>
            </div>
            <div className="goal-actions" aria-label="Support the Smudge goal">
              <SocialLink
                className="goal-action goal-action-primary"
                href={CAMPAIGN.supportUrl}
                label="DIRECT SMUDGE SUPPORT"
              />
              <SocialLink
                className="goal-action"
                href={CAMPAIGN.merchUrl}
                label="SHOP OFFICIAL MERCH"
              />
              <SocialLink
                className="goal-action"
                href={CAMPAIGN.charityUrl}
                label="FURRY TALES CHARITY"
              />
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
            <span>05</span>
            <p>THE MISSION</p>
          </div>
          <div className="campaign-main">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> OPERATION: SUPPORT SMUDGE
            </p>
            <h2>RAISE IT. SUPPORT HIM. SHOW THE RECEIPTS.</h2>
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
            <span>06</span>
            <p>THE SMUDGE PROMISE</p>
          </div>
          <p className="eyebrow light">
            <span aria-hidden="true">●</span> THE SMUDGE PROMISE
          </p>
          <div className="promise-grid">
            <div className="hundred">
              <span>100</span>
              <b>%</b>
            </div>
            <div className="promise-copy">
              <h2>OF CREATOR FEES ARE RESERVED FOR SMUDGE AND HIS OWNER.</h2>
              <p>
                Until direct contact is verified, support uses Smudge’s official
                merch and direct-support links. The fee reserve is held for a
                documented owner handoff with public receipts.
              </p>
              <a className="promise-goal-link" href="#goal">
                First stop: {usd.format(CAMPAIGN.goalUsd)}. Track it live ↑
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        className="socials-section campaign-section"
        id="socials"
        data-reveal
      >
        <div className="section-shell campaign-grid">
          <div className="section-label">
            <span>07</span>
            <p>SOCIALS</p>
          </div>
          <div className="campaign-main">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> FOLLOW THE REAL SMUDGE
            </p>
            <h2>ONE UNBOTHERED CAT. A VERY LARGE INTERNET.</h2>
            <div className="social-grid">
              <a
                className="social-card social-card-featured"
                href={CAMPAIGN.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Instagram</span>
                  <strong>@smudge_lord ↗</strong>
                </div>
                <dl>
                  <div>
                    <dt>Followers</dt>
                    <dd>1.5M</dd>
                  </div>
                  <div>
                    <dt>Posts</dt>
                    <dd>685</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>Icon</dd>
                  </div>
                </dl>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.tiktokUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>TikTok</span>
                  <strong>@smudge_lord ↗</strong>
                </div>
                <p>Official Smudge videos, table manners, and gremlin energy.</p>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.xUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>X</span>
                  <strong>@SmudgeLord ↗</strong>
                </div>
                <p>The official account for the cat who hates vegetals.</p>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.facebookUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Facebook</span>
                  <strong>Smudge Lord Official ↗</strong>
                </div>
                <p>Official posts and a whole table full of Smudge fans.</p>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.merchUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Official merch</span>
                  <strong>Shop Smudge Lord ↗</strong>
                </div>
                <p>Buy directly through Smudge’s official store.</p>
              </a>
              <a
                className="social-card"
                href={CAMPAIGN.charityUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>Rescue charity</span>
                  <strong>Furry Tales ↗</strong>
                </div>
                <p>Support the rescue organization featured by Smudge’s official links.</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta section-shell" data-reveal>
        <div>
          <p className="eyebrow">
            <span aria-hidden="true">●</span> CHARITY COIN. MEME COIN ENERGY.
          </p>
          <h2>PUT THE INTERNET’S MOST UNBOTHERED CAT ON SOLANA.</h2>
        </div>
        <a
          className="round-link"
          href={CAMPAIGN.xUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Follow Smudge on X"
        >
          <span>FOLLOW</span>
          <strong aria-hidden="true">↗</strong>
        </a>
      </section>

      <section
        className="launch-banner section-shell"
        aria-label="Smudge banner"
        data-reveal
      >
        <a href={CAMPAIGN.instagramUrl} target="_blank" rel="noreferrer">
          <Image
            src="/smudge-original.jpg"
            alt="Smudge sitting at the dinner table behind a plate of salad"
            width={746}
            height={545}
            sizes="(max-width: 1440px) 94vw, 1312px"
          />
          <span>FOLLOW SMUDGE ON INSTAGRAM ↗</span>
        </a>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Image src="/smudge-avatar.png" alt="" width={38} height={38} />
            <strong>SMUDGE THE TABLE CAT</strong>
          </div>
          <div className="footer-socials">
            <SocialLink href={CAMPAIGN.xUrl} label="X" />
            <SocialLink href={CAMPAIGN.tiktokUrl} label="TikTok" />
            <SocialLink href={CAMPAIGN.instagramUrl} label="Instagram" />
            <SocialLink href={CAMPAIGN.facebookUrl} label="Facebook" />
            <SocialLink href={CAMPAIGN.merchUrl} label="Official merch" />
            <SocialLink href={CAMPAIGN.supportUrl} label="Direct support" />
            <SocialLink href={CAMPAIGN.charityUrl} label="Furry Tales" />
            <SocialLink href={CAMPAIGN.linktreeUrl} label="All Smudge links" />
          </div>
        </div>
        <div className="footer-legal">
          <p>
            Smudge is a community meme coin, not an investment product. Crypto
            is volatile. Nothing here is financial advice.
          </p>
          <p>
            Smudge is a community-run fan project. It is not affiliated with
            Smudge’s owner. Support uses official public links for now.
          </p>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </footer>
    </main>
  );
}
