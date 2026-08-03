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
    copy: "100% of creator fees are reserved for Timon and his owner.",
  },
  {
    status: "contacting",
    title: "Support",
    copy: "The community supports Timon through his verified public channels while the reserve grows.",
  },
  {
    status: "responded",
    title: "Verify",
    copy: "Every direct handoff is coordinated with the real owner and documented before it is counted.",
  },
  {
    status: "donated",
    title: "Share",
    copy: "Completed support is published with receipts so the community can follow every contribution.",
  },
];

const greatestHits = [
  {
    rank: "01",
    title: "The yellow hat era",
    metricOneLabel: "Pinned views",
    metricOne: "19.5M",
    metricTwoLabel: "Energy",
    metricTwo: "Iconic",
    image: "/timon-hero.png",
    alt: "Timon the Meerkat wearing his yellow hat and sunglasses",
  },
  {
    rank: "02",
    title: "Peak bath-time chaos",
    metricOneLabel: "Pinned views",
    metricOne: "16.9M",
    metricTwoLabel: "Mood",
    metricTwo: "Unreal",
    image: "/timon-pfp-comic.png",
    alt: "A comic portrait of Timon the Meerkat",
  },
  {
    rank: "03",
    title: "Tiny animal, huge timeline",
    metricOneLabel: "Pinned views",
    metricOne: "15.3M",
    metricTwoLabel: "Status",
    metricTwo: "Viral",
    image: "/timon-pfp-clay.png",
    alt: "A clay portrait of Timon the Meerkat",
  },
] as const;

const pfpDownloads = [
  {
    title: "Studio Timon",
    detail: "Clean classic",
    image: "/timon-pfp-studio.png",
  },
  {
    title: "Comic Timon",
    detail: "Halftone hero",
    image: "/timon-pfp-comic.png",
  },
  {
    title: "Pixel Timon",
    detail: "16-bit lookout",
    image: "/timon-pfp-pixel.png",
  },
  {
    title: "Clay Timon",
    detail: "Handmade legend",
    image: "/timon-pfp-clay.png",
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
    <a className={className} href={href} target="_blank" rel="noreferrer">
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
        <a className="brand" href="#top" aria-label="Timon home">
          <span className="brand-avatar">
            <Image src="/timon-avatar.png" alt="" width={42} height={42} priority />
          </span>
          <span className="brand-name">TIMON</span>
          <span className="brand-tag">THE MEERKAT</span>
        </a>

        <nav className="header-center" aria-label="Main navigation">
          <a href="#story">Story</a>
          <a href="#hits">Greatest hits</a>
          <a href="#pfp">PFP studio</a>
          <a href="#goal">Support</a>
          <a href="#socials">Socials</a>
        </nav>

        <div className="header-actions">
          <SocialLink className="header-social instagram-social" href={CAMPAIGN.instagramUrl} label="IG" />
          <SocialLink className="header-social tiktok-social" href={CAMPAIGN.tiktokUrl} label="TK" />
          <SocialLink className="header-social x-social" href={CAMPAIGN.xUrl} label="X" />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">●</span> THE INTERNET&apos;S FAVORITE MEERKAT</p>
          <div className="launch-signal">
            <a href={CAMPAIGN.xUrl} target="_blank" rel="noreferrer">Follow @timonsurik ↗</a>
          </div>
          <h1>MEET <span>TIMON.</span><br />THE MEERKAT.</h1>
          <p className="hero-dek">
            A tiny viral animal creator with giant main-character energy, legendary costumes, and a community that cannot stop watching.
          </p>
          <p className="hero-mission">
            <strong>$TIMON</strong> brings the yellow-hat icon to Solana with a playful PFP lab built for the timeline.
          </p>
          <p className="hero-goal-copy">
            100% of creator fees are reserved for Timon and his owner, with public receipts for completed support.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#pfp">BUILD YOUR TIMON PFP ↓</a>
            <a className="progress-pill" href="#goal">
              <strong>{usd.format(raised)}</strong> raised of {usd.format(CAMPAIGN.goalUsd)} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Timon the viral meerkat">
          <div className="sunburst" aria-hidden="true" />
          <div className="photo-frame">
            <Image
              src="/timon-hero.png"
              alt="Timon the Meerkat wearing a yellow hat and black sunglasses"
              fill
              priority
              sizes="(max-width: 820px) 92vw, 46vw"
            />
          </div>
          <div className="sticker sticker-fees"><strong>100%</strong><span>CREATOR FEES FOR TIMON</span></div>
          <div className="sticker sticker-energy"><span>SMALL MEERKAT.</span><strong>HUGE ENERGY.</strong></div>
        </div>
      </section>

      <section className="stats" aria-label="Timon's TikTok stats">
        <div className="stat"><strong>258.8K</strong><span>TikTok followers</span></div>
        <div className="stat"><strong>22.4M</strong><span>TikTok likes</span></div>
        <div className="stat"><strong>51.7M</strong><span>Views across three pinned hits</span></div>
        <p className="stats-note">TikTok profile snapshot · August 2026</p>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>TIMON THE MEERKAT</span><b>✦</b><span>BUILD YOUR TIMON PFP</span><b>✦</b>
          <span>100% OF CREATOR FEES FOR TIMON</span><b>✦</b><span>258.8K FOLLOWERS</span><b>✦</b>
          <span>22.4M LIKES</span><b>✦</b><span>HAKUNA MATATA</span><b>✦</b>
          <span>TIMON THE MEERKAT</span><b>✦</b><span>BUILD YOUR TIMON PFP</span><b>✦</b>
          <span>100% OF CREATOR FEES FOR TIMON</span><b>✦</b><span>258.8K FOLLOWERS</span><b>✦</b>
          <span>22.4M LIKES</span><b>✦</b><span>HAKUNA MATATA</span><b>✦</b>
        </div>
      </div>

      <section className="story section-shell" id="story" data-reveal>
        <div className="section-label"><span>01</span><p>THE STORY</p></div>
        <div className="story-copy">
          <h2>ONE TINY LOOKOUT. MILLIONS STOPPED SCROLLING.</h2>
          <div className="story-columns">
            <p>
              Timon is a real pet meerkat whose curious stare, little paws, costumes, and perfectly timed reactions turned everyday clips into massive TikTok moments.
            </p>
            <p>
              From pink hats to yellow shades, Timon brings a new look to every post. The formula is simple: tiny meerkat, huge personality, endless remix potential.
            </p>
          </div>
        </div>
        <aside className="story-card">
          <span className="tiny-pill">WHY TIMON?</span>
          <p><strong>He is built for the timeline.</strong> 258.8K followers, 22.4M likes, and more than 50M views across the three pinned videos shown on his profile.</p>
          <span className="timon-mark" aria-hidden="true">T</span>
        </aside>
      </section>

      <section className="hits-section campaign-section" id="hits" data-reveal>
        <div className="section-shell hits-shell">
          <div className="section-label"><span>02</span><p>GREATEST HITS</p></div>
          <div className="hits-main">
            <div className="hits-heading">
              <div><p className="eyebrow light"><span aria-hidden="true">●</span> VIRAL BY NATURE</p><h2>TIMON&apos;S GREATEST HITS.</h2></div>
              <div className="hits-total"><strong>50M+</strong><span>pinned views combined</span></div>
            </div>
            <p className="hits-intro">Three pinned clips. More than fifty million views. One unmistakable little face.</p>
            <div className="hits-grid">
              {greatestHits.map((hit) => (
                <article className="hit-card" key={hit.rank}>
                  <div className="hit-video"><Image src={hit.image} alt={hit.alt} fill sizes="(max-width: 820px) 82vw, 29vw" /><span>{hit.rank}</span></div>
                  <div className="hit-copy">
                    <h3>{hit.title}</h3>
                    <dl><div><dt>{hit.metricOneLabel}</dt><dd>{hit.metricOne}</dd></div><div><dt>{hit.metricTwoLabel}</dt><dd>{hit.metricTwo}</dd></div></dl>
                    <a href={CAMPAIGN.tiktokUrl} target="_blank" rel="noreferrer">WATCH ON TIKTOK ↗</a>
                  </div>
                </article>
              ))}
            </div>
            <p className="hits-note">Public TikTok profile snapshot checked August 2026.</p>
          </div>
        </div>
      </section>

      <section className="pfp-section campaign-section" id="pfp" data-reveal>
        <div className="section-shell pfp-shell">
          <div className="section-label"><span>03</span><p>PFP STUDIO</p></div>
          <div className="pfp-main">
            <div className="pfp-heading">
              <div><p className="eyebrow"><span aria-hidden="true">●</span> THE TIMON MACHINE</p><h2>ONE MEERKAT. INFINITE LOOKS.</h2></div>
              <p>Choose your Timon, switch the background, add a hat, shades, and neckwear, then download a crisp circle-safe PNG.</p>
            </div>
            <PfpStudio />
            <div className="pfp-download-heading"><div><span>READY-MADE PFP PACK</span><h3>DON&apos;T WANT TO BUILD? TAKE ONE.</h3></div><p>Free to download. Built for the timeline.</p></div>
            <div className="pfp-download-grid">
              {pfpDownloads.map((pfp) => (
                <article className="pfp-download-card" key={pfp.title}>
                  <Image src={pfp.image} alt={`${pfp.title} profile picture`} width={1024} height={1024} sizes="(max-width: 580px) 82vw, (max-width: 1000px) 42vw, 21vw" />
                  <div><span>{pfp.detail}</span><strong>{pfp.title}</strong><a href={pfp.image} download>DOWNLOAD PNG ↓</a></div>
                </article>
              ))}
            </div>
            <div className="bot-card" id="bot">
              <div className="bot-pulse" aria-hidden="true"><i />BOT</div>
              <div><p className="eyebrow"><span aria-hidden="true">●</span> AUTOMATED TIMON REPLIES</p><h3>TAG THE BOT. GET TIMONIZED.</h3><p>Mention or reply to the Timon bot on X. It reads the style of your profile picture, creates a one-of-one Timon version, and replies with the finished image.</p></div>
              {CAMPAIGN.botHandle ? <a href={`https://x.com/${CAMPAIGN.botHandle.replace(/^@/, "")}`} target="_blank" rel="noreferrer">TAG @{CAMPAIGN.botHandle.replace(/^@/, "")} ↗</a> : <span>BOT HANDLE DROPS AT ACTIVATION</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="goal-section campaign-section" id="goal" data-reveal>
        <div className="section-shell campaign-grid">
          <div className="section-label"><span>04</span><p>THE GOAL</p></div>
          <div className="campaign-main">
            <p className="eyebrow"><span aria-hidden="true">●</span> THE SUPPORT METER</p>
            <h2>{usd.format(CAMPAIGN.goalUsd)} FOR TIMON AND HIS OWNER. EVERY VERIFIED CONTRIBUTION COUNTS.</h2>
            <CampaignProgress raisedUsd={raised} goalUsd={CAMPAIGN.goalUsd} />
            <div className="wallet-proof">
              <p>Every verified contribution moves this meter.</p>
              {CAMPAIGN.careWallet ? <a href={`https://solscan.io/account/${encodeURIComponent(CAMPAIGN.careWallet)}`} target="_blank" rel="noreferrer">SUPPORT WALLET ↗</a> : null}
              <strong>Contributions are counted after verification and updated publicly.</strong>
            </div>
            <div className="goal-actions" aria-label="Support Timon">
              <SocialLink className="goal-action goal-action-primary" href={CAMPAIGN.taplinkUrl} label="TIMON'S OFFICIAL LINKS" />
              <SocialLink className="goal-action" href={CAMPAIGN.tiktokUrl} label="FOLLOW ON TIKTOK" />
              <SocialLink className="goal-action" href={CAMPAIGN.instagramUrl} label="FOLLOW ON INSTAGRAM" />
            </div>
          </div>
        </div>
      </section>

      <section className="mission-section campaign-section" id="mission" data-reveal>
        <div className="section-shell campaign-grid">
          <div className="section-label"><span>05</span><p>THE MISSION</p></div>
          <div className="campaign-main">
            <p className="eyebrow"><span aria-hidden="true">●</span> OPERATION: SUPPORT TIMON</p>
            <h2>RAISE IT. SUPPORT HIM. SHOW THE RECEIPTS.</h2>
            <div className="mission-timeline">
              {missionSteps.map((step, index) => {
                const state = index < statusIndex ? "completed" : index === statusIndex ? "active" : "future";
                return <div className={`mission-step ${state}`} key={step.status}><div className="mission-node" aria-hidden="true">{state === "completed" ? "✓" : <i />}</div><div><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.copy}</p></div></div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="promise" id="promise" data-reveal>
        <div className="promise-inner">
          <div className="promise-number"><span>06</span><p>THE TIMON PROMISE</p></div>
          <p className="eyebrow light"><span aria-hidden="true">●</span> THE TIMON PROMISE</p>
          <div className="promise-grid">
            <div className="hundred"><span>100</span><b>%</b></div>
            <div className="promise-copy"><h2>OF CREATOR FEES ARE RESERVED FOR TIMON AND HIS OWNER.</h2><p>The goal is direct, documented support for Timon. Until each handoff is verified, the reserve stays reserved. Completed support is shared publicly.</p><a className="promise-goal-link" href="#goal">First stop: {usd.format(CAMPAIGN.goalUsd)}. Track it live ↑</a></div>
          </div>
        </div>
      </section>

      <section className="socials-section campaign-section" id="socials" data-reveal>
        <div className="section-shell campaign-grid">
          <div className="section-label"><span>07</span><p>SOCIALS</p></div>
          <div className="campaign-main">
            <p className="eyebrow"><span aria-hidden="true">●</span> FOLLOW TIMON</p>
            <h2>THE LOOKOUT POST IS OPEN.</h2>
            <div className="social-grid">
              <a className="social-card social-card-featured" href={CAMPAIGN.tiktokUrl} target="_blank" rel="noreferrer">
                <div><span>TikTok</span><strong>@timon.surik ↗</strong></div>
                <dl><div><dt>Followers</dt><dd>258.8K</dd></div><div><dt>Likes</dt><dd>22.4M</dd></div><div><dt>Pinned views</dt><dd>51.7M</dd></div></dl>
              </a>
              <a className="social-card" href={CAMPAIGN.instagramUrl} target="_blank" rel="noreferrer"><div><span>Instagram</span><strong>@timon.surik ↗</strong></div><p>Photos, reels, costumes, and daily meerkat life.</p></a>
              <a className="social-card" href={CAMPAIGN.xUrl} target="_blank" rel="noreferrer"><div><span>X</span><strong>@timonsurik ↗</strong></div><p>The community timeline for Timon on Solana.</p></a>
              <a className="social-card" href={CAMPAIGN.taplinkUrl} target="_blank" rel="noreferrer"><div><span>Official links</span><strong>Timon&apos;s Taplink ↗</strong></div><p>The link hub shared directly from Timon&apos;s TikTok profile.</p></a>
              <a className="social-card" href="#pfp"><div><span>PFP lab</span><strong>Make your Timon ↓</strong></div><p>Hats, shades, ties, backgrounds, frames, and instant PNG downloads.</p></a>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta section-shell" data-reveal>
        <div><p className="eyebrow"><span aria-hidden="true">●</span> TINY MEERKAT. BIG INTERNET.</p><h2>PUT TIMON ON THE TIMELINE.</h2></div>
        <a className="round-link" href="#pfp" aria-label="Build a Timon profile picture"><span>BUILD PFP</span><strong aria-hidden="true">↓</strong></a>
      </section>

      <section className="launch-banner section-shell" aria-label="Timon banner" data-reveal>
        <a href={CAMPAIGN.tiktokUrl} target="_blank" rel="noreferrer"><Image src="/og.png" alt="Timon the Meerkat banner" width={1200} height={630} sizes="(max-width: 1440px) 94vw, 1312px" /><span>WATCH TIMON ON TIKTOK ↗</span></a>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand"><Image src="/timon-avatar.png" alt="" width={38} height={38} /><strong>TIMON THE MEERKAT</strong></div>
          <div />
          <div className="footer-socials"><SocialLink href={CAMPAIGN.xUrl} label="X" /><SocialLink href={CAMPAIGN.tiktokUrl} label="TikTok" /><SocialLink href={CAMPAIGN.instagramUrl} label="Instagram" /><SocialLink href={CAMPAIGN.taplinkUrl} label="Official links" /></div>
        </div>
        <div className="footer-legal">
          <p>Timon is a community meme coin, not an investment product. Crypto is volatile. Nothing here is financial advice.</p>
          <p>Timon is a community-run fan project. Creator fees are reserved for Timon and his owner, with verified support documented publicly.</p>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </footer>
    </main>
  );
}
