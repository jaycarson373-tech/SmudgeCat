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

test("server-renders the Rigby landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Rigby on Solana \| \$RIGBY<\/title>/i);
  assert.match(html, /MEET/);
  assert.match(html, /RIGBY/);
  assert.match(html, /THE FAINTING GOAT CAT/);
  assert.match(html, /3M/);
  assert.match(html, /2\.35M\+/);
  assert.match(html, /1B\+/);
  assert.match(html, /over 1 billion total views/i);
  assert.match(html, /myotonia congenita/i);
  assert.match(html, /RIGBY’S GREATEST HITS/);
  assert.match(html, /271\.8M/);
  assert.match(html, /43\.9 million likes/i);
  assert.match(html, /142\.1M/);
  assert.match(html, /21\.5M/);
  assert.match(html, /73\.5M/);
  assert.match(html, /12\.8M/);
  assert.match(html, /56\.2M/);
  assert.match(html, /9\.6M/);
  assert.match(html, /rigby-greatest-hit-1\.mp4/);
  assert.match(html, /rigby-greatest-hit-2\.mp4/);
  assert.match(html, /rigby-greatest-hit-3\.mp4/);
  assert.match(html, /7606523760253947166/);
  assert.match(html, /7625807340045913374/);
  assert.match(html, /7473553601965870382/);
  assert.match(html, /THE THERMOMETER/);
  assert.match(html, /OPERATION: SUPPORT RIGBY/);
  assert.match(html, /\$5,000/);
  assert.match(html, /https:\/\/x\.com\/rigbycat_solana/);
  assert.doesNotMatch(html, /AmxxQwEZzB2rzP2LpkYBogJRqdfg3msxqazTTqZGpump/);
  assert.doesNotMatch(html, /jup\.ag|pump\.fun|dexscreener|HOW TO BUY|CA DROPS SOON/i);
  assert.match(html, /FOLLOW THE REAL RIGBY/);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@iamrigbycat/);
  assert.match(html, /https:\/\/www\.instagram\.com\/iamrigbycat/);
  assert.match(html, /https:\/\/www\.cameo\.com\/iamrigbycat/);
  assert.match(html, /https:\/\/rigbycat\.dashery\.com/);
  assert.match(html, /100%/);
  assert.match(html, /OF FEES GO BACK TOWARD SUPPORTING RIGBY/);
  assert.match(html, /rigby-hero\.jpg/);
  assert.match(html, /rigby-og\.png/);
  assert.match(html, /rigby-avatar\.png/);
  assert.match(html, /rigby-favicon\.png/);
  assert.match(html, /rigby-apple-touch-icon\.png/);
  assert.match(html, /rigby-launch-banner\.jpg/);
  assert.doesNotMatch(
    html,
    /codex-preview|Your site is taking shape|\b2-2\b|\$2-2|27M|Tutu|Dino Cat|dinocattutu|tutu-hero|tutu-banner|4aKxVRf|dinocat_pf|—/i,
  );
});
