import Image from "next/image";

const tiktokUrl = "https://www.tiktok.com/@dinocattutu";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="2-2 home">
          <span className="brand-avatar">
            <Image
              src="/favicon.png"
              alt=""
              width={42}
              height={42}
              priority
            />
          </span>
          <span className="brand-name">2-2</span>
          <span className="brand-tag">DINO CAT</span>
        </a>

        <nav aria-label="Main navigation">
          <a href="#story">The story</a>
          <a href="#promise">The promise</a>
          <a
            className="nav-cta"
            href={tiktokUrl}
            target="_blank"
            rel="noreferrer"
          >
            TikTok <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true">●</span> THE INTERNET’S TWO-LEGGED HERO
          </p>
          <h1>
            MEET <span>2-2.</span>
            <br />
            THE DINO CAT.
          </h1>
          <p className="hero-dek">
            Two back legs. One giant heart. Zero quit. Tutu turned a difficult
            start into a story millions can’t stop cheering for.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href={tiktokUrl}
              target="_blank"
              rel="noreferrer"
            >
              Follow Tutu <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#promise">
              See the fee promise <span aria-hidden="true">↓</span>
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
          <div className="sticker sticker-views">
            <strong>27M+</strong>
            <span>VIRAL VIEWS</span>
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
          <strong>27M+</strong>
          <span>Breakout video views</span>
        </div>
        <div className="stat">
          <strong>532</strong>
          <span>Videos &amp; counting</span>
        </div>
        <p className="stats-note">Public TikTok stats · July 24, 2026</p>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>2-2 THE DINO CAT</span>
          <b>✦</b>
          <span>BUILT DIFFERENT</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
          <b>✦</b>
          <span>2-2 THE DINO CAT</span>
          <b>✦</b>
          <span>BUILT DIFFERENT</span>
          <b>✦</b>
          <span>BELOVED BY MILLIONS</span>
        </div>
      </div>

      <section className="story section-shell" id="story">
        <div className="section-label">
          <span>01</span>
          <p>THE STORY</p>
        </div>
        <div className="story-copy">
          <h2>HE DOESN’T NEED FOUR LEGS TO RUN THE INTERNET.</h2>
          <div className="story-columns">
            <p>
              After losing both front legs, Tutu learned to move through life
              on his own terms—hopping, balancing, climbing, and charming
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
          <span className="tiny-pill">WHY 2-2?</span>
          <p>
            It sounds like <strong>Tutu</strong>—and celebrates the two legs
            that made him an icon.
          </p>
          <span className="dino-mark" aria-hidden="true">
            2
          </span>
        </aside>
      </section>

      <section className="promise" id="promise">
        <div className="promise-inner">
          <p className="eyebrow light">
            <span aria-hidden="true">●</span> THE 2-2 PROMISE
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
              <a
                className="button button-light"
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
              >
                Meet the real Tutu <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta section-shell">
        <div>
          <p className="eyebrow">
            <span aria-hidden="true">●</span> ONE CAT. MILLIONS OF FANS.
          </p>
          <h2>WELCOME TO THE DINO ERA.</h2>
        </div>
        <a
          className="round-link"
          href={tiktokUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Follow Tutu on TikTok"
        >
          <span>FOLLOW</span>
          <strong aria-hidden="true">↗</strong>
        </a>
      </section>

      <footer>
        <div className="footer-brand">
          <Image src="/favicon.png" alt="" width={34} height={34} />
          <strong>2-2 THE DINO CAT</strong>
        </div>
        <p>
          2-2 is a community meme coin, not an investment product. Crypto is
          volatile. Nothing here is financial advice.
        </p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
