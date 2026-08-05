import assert from "node:assert/strict";
import test from "node:test";

let renderedPage;

async function render() {
  if (!renderedPage) {
    renderedPage = (async () => {
      const workerUrl = new URL("../dist/server/index.js", import.meta.url);
      workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
      const { default: worker } = await import(workerUrl.href);

      const response = await worker.fetch(
        new Request("http://localhost/", {
          headers: { accept: "text/html" },
        }),
        {
          ASSETS: {
            fetch: async () => new Response("Not found", { status: 404 }),
          },
        },
        { waitUntil() {}, passThroughOnException() {} },
      );

      assert.equal(response.status, 200);
      assert.match(
        response.headers.get("content-type") ?? "",
        /^text\/html\b/i,
      );
      return response.text();
    })();
  }

  return renderedPage;
}

test("server-renders the Zazu identity and exact elemental archive", async () => {
  const html = await render();

  assert.match(html, /<title>\$ZAZU \| The Stare That Burns Back<\/title>/i);
  assert.match(html, /ZAZU/);
  assert.match(html, /THE STARE THAT/i);
  assert.match(html, /BURNS BACK/i);
  assert.match(html, /ZAZU THE GRAY TABBY CAT/i);
  assert.match(html, /SAME CAT\. FORTY CONDITIONS\./i);
  assert.match(html, /ZAZU FILE ARCHIVE/i);
  assert.match(html, /EARTH/i);
  assert.match(html, /VOID/i);
  assert.match(html, /WATER/i);
  assert.match(html, /FIRE/i);
  assert.match(html, /40[\s\S]*FILES FOUND/i);

  assert.match(html, /zazu-avatar\.png/i);
  assert.match(html, /zazu-elements\.jpg/i);
  assert.match(html, /zazu-40-grid\.png/i);
  assert.match(html, /zazu-favicon\.png/i);
  assert.match(html, /zazu-apple-touch-icon\.png/i);
  assert.match(html, /\/og\.png/i);
  assert.match(
    html,
    /Forty .*elemental Zazu cat variations in an eight by five grid/i,
  );
});

test("server-renders the public terminal, eligibility rules, and security rails", async () => {
  const html = await render();

  assert.match(html, /PUBLIC BUYBACK TERMINAL/i);
  assert.match(html, /CONTRACT-DERIVED DATA ONLY/i);
  assert.match(html, /WATCH THE VAULT/i);
  assert.match(html, /VERIFY THE LOOP/i);
  assert.match(html, /No fake countdown and no manually entered burn total/i);
  assert.match(html, /READ-ONLY PUBLIC DATA/i);
  assert.match(html, /BUYBACK HISTORY/i);
  assert.match(html, /Every row comes from a BuybackExecuted event/i);
  assert.match(html, /VAULT NOT CONFIGURED/i);
  assert.match(html, /The ledger populates only after confirmed on-chain events/i);
  assert.match(html, /AWAITING VERIFIED DEPLOYMENT/i);
  assert.match(html, /AWAITING VERIFIED VAULT/i);

  assert.match(html, /Targeting 15-minute intervals when fees are available\./i);
  assert.match(
    html,
    /A cycle is skipped when liquidity, slippage, price impact, gas, or network conditions are unsafe\./i,
  );
  assert.match(
    html,
    /never promised to execute exactly every 15 minutes\./i,
  );
  assert.match(html, /The contract does not wake itself up\./i);
  assert.match(html, /KEEPER CHECKS EVERY 60 SECONDS/i);
  assert.match(html, /KEEPER CANNOT WITHDRAW/i);
  assert.match(html, /STRICT MAXIMUM BUY SIZE/i);
  assert.match(html, /NONZERO MINIMUM OUTPUT/i);
  assert.match(html, /PRICE IMPACT CEILING/i);
  assert.match(html, /SIMULATION BEFORE SUBMIT/i);
  assert.match(html, /PAUSABLE BY MULTISIG OWNER/i);
  assert.match(html, /TIMELOCK OPTION FOR ROUTER AND DESTINATION/i);
  assert.match(html, /No production DEX adapter or underlying router is hardcoded\./i);
  assert.match(html, /PRODUCTION ADDRESSES[\s\S]*TESTNET PROOF/i);

  assert.match(html, /https:\/\/www\.instagram\.com\/zazubabyman\//i);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@zazubabyman_/i);
  assert.match(html, /https:\/\/pons\.family\/launchpad/i);
  assert.match(html, /https:\/\/robinhoodchain\.blockscout\.com\//i);
  assert.match(html, /Not affiliated with or endorsed by Robinhood, Pons, a DEX, or Zazu/i);

  assert.doesNotMatch(html, />\s*\d{1,2}:\d{2}\s*</);
});

test("rendered output has no previous brands, old contracts, generators, or stale chain copy", async () => {
  const html = await render();

  assert.doesNotMatch(
    html,
    /Timon|Smudge|Tutu|Rigby|Dino Cat|dinocattutu|iamrigbycat|timon\.surik|zazubabyman_?\/video/i,
  );
  assert.doesNotMatch(
    html,
    /PFP STUDIO|PFP GENERATOR|TIMONIZED|TAG THE BOT|REPLY BOT|\/api\/x-bot|DOWNLOAD PNG|BUILD YOUR/i,
  );
  assert.doesNotMatch(
    html,
    /SUPPORT METER|OPERATION: SUPPORT|DONATION THERMOMETER|\$5,000 GOAL/i,
  );
  assert.doesNotMatch(
    html,
    /4aKxVRfAPREPBK3ziUgWUAX9kdPSkLv9PgyXGLXYpump|AmxxQwEZzB2rzP2LpkYBogJRqdfg3msxqazTTqZGpump/i,
  );
  assert.doesNotMatch(html, /Solana|pump\.fun|jup\.ag|Jupiter/i);
  assert.doesNotMatch(html, /—/);
});
