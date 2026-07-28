import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Smudge landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Smudge the Table Cat \| \$SMUDGE<\/title>/i);
  assert.match(html, /MEET/);
  assert.match(html, /SMUDGE/);
  assert.match(html, /THE TABLE CAT/);
  assert.match(html, /Smudge the Table Cat claimed one seat/i);
  assert.match(html, /1\.5M/);
  assert.match(html, /50K\+/);
  assert.match(html, /TIME’s 2020 cat ranking/i);
  assert.match(html, /he no like vegetals/i);
  assert.match(html, /Ottawa/i);
  assert.match(html, /SMUDGE’S GREATEST HITS/);
  assert.match(html, /Meme of the Year/i);
  assert.match(html, /Shorty Award/i);
  assert.match(html, /smudge-original\.jpg/);
  assert.match(html, /smudge-kitten\.jpg/);
  assert.match(html, /smudge-collectible\.jpg/);
  assert.match(html, /175034192749/);
  assert.match(html, /shortyawards\.com\/12th\/woman-yells-at-cat/);
  assert.match(html, /THE SMUDGE MACHINE/);
  assert.match(html, /ONE CAT\. INFINITE INTERNET\./);
  assert.match(html, /MAKE A SMUDGE PFP/);
  assert.match(html, /TAG THE BOT\. GET YOUR PFP SMUDGED\./);
  assert.match(html, /smudge-pfp-studio\.png/);
  assert.match(html, /smudge-pfp-comic\.png/);
  assert.match(html, /smudge-pfp-pixel\.png/);
  assert.match(html, /smudge-pfp-clay\.png/);
  assert.match(html, /DOWNLOAD PNG/);
  assert.match(html, /THE THERMOMETER/);
  assert.match(html, /OPERATION: SUPPORT SMUDGE/);
  assert.match(html, /\$5,000/);
  assert.match(html, /https:\/\/x\.com\/SmudgeLord/);
  assert.doesNotMatch(html, /AmxxQwEZzB2rzP2LpkYBogJRqdfg3msxqazTTqZGpump/);
  assert.doesNotMatch(html, /jup\.ag|pump\.fun|dexscreener|HOW TO BUY|CA DROPS SOON/i);
  assert.match(html, /FOLLOW THE REAL SMUDGE/);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@smudge_lord/);
  assert.match(html, /https:\/\/www\.instagram\.com\/smudge_lord/);
  assert.match(html, /https:\/\/www\.facebook\.com\/smudgelordofficial/);
  assert.match(html, /https:\/\/www\.paypal\.me\/smudgelord/);
  assert.match(html, /https:\/\/smudge-lord\.com/);
  assert.match(html, /https:\/\/www\.furry-tales\.ca/);
  assert.match(html, /100%/);
  assert.match(
    html,
    /OF CREATOR FEES ARE RESERVED FOR SMUDGE AND HIS OWNER/,
  );
  assert.match(html, /smudge-avatar\.png/);
  assert.match(html, /smudge-favicon\.png/);
  assert.match(html, /smudge-apple-touch-icon\.png/);
  assert.match(html, /https:\/\/smudge-table-cat\.vercel\.app\/og\.png/);
  assert.doesNotMatch(
    html,
    /codex-preview|Your site is taking shape|\b2-2\b|\$2-2|27M|Tutu|Dino Cat|dinocattutu|tutu-hero|tutu-banner|4aKxVRf|dinocat_pf|Rigby|iamrigbycat|fainting goat|myotonia|blep|—/i,
  );
});
