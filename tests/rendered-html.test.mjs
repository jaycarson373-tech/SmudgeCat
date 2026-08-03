import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Timon landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Timon the Meerkat \| \$TIMON<\/title>/i);
  assert.match(html, /MEET/);
  assert.match(html, /TIMON/);
  assert.match(html, /THE MEERKAT/);
  assert.match(html, /258\.8K/);
  assert.match(html, /22\.4M/);
  assert.match(html, /51\.7M/);
  assert.match(html, /TIMON'S GREATEST HITS/i);
  assert.match(html, /THE TIMON MACHINE/i);
  assert.match(html, /ONE MEERKAT\. INFINITE LOOKS\./i);
  assert.match(html, /BUILD YOUR TIMON PFP/i);
  assert.match(html, /TAG THE BOT\. GET TIMONIZED\./i);
  assert.match(html, /timon-pfp-studio\.png/);
  assert.match(html, /timon-pfp-comic\.png/);
  assert.match(html, /timon-pfp-pixel\.png/);
  assert.match(html, /timon-pfp-clay\.png/);
  assert.match(html, /DOWNLOAD PNG/);
  assert.match(html, /THE SUPPORT METER/);
  assert.match(html, /OPERATION: SUPPORT TIMON/);
  assert.match(html, /\$5,000/);
  assert.match(html, /https:\/\/x\.com\/timonsurik/);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@timon\.surik/);
  assert.match(html, /https:\/\/www\.instagram\.com\/timon\.surik/);
  assert.match(html, /https:\/\/taplink\.cc\/timonsurik/);
  assert.match(html, /100%/);
  assert.match(html, /OF CREATOR FEES ARE RESERVED FOR TIMON AND HIS OWNER/);
  assert.match(html, /timon-avatar\.png/);
  assert.match(html, /timon-favicon\.png/);
  assert.match(html, /timon-apple-touch-icon\.png/);
  assert.match(html, /\/og\.png/);
  assert.doesNotMatch(html, /Smudge|Rigby|Tutu|Dino Cat|dinocattutu|iamrigbycat|fainting goat|myotonia|vegetals|table cat|2-2|27M|—/i);
});
