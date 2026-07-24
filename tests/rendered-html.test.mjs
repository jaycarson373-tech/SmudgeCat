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

test("server-renders the DinoCat landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>2-2 — The Dino Cat<\/title>/i);
  assert.match(html, /MEET/);
  assert.match(html, /THE DINO CAT/);
  assert.match(html, /464K\+/);
  assert.match(html, /17\.9M/);
  assert.match(html, /100/);
  assert.match(html, /OF FEES GO TOWARD GIVING TUTU A BETTER LIFE/);
  assert.match(html, /tutu-hero\.jpg/);
  assert.match(html, /favicon\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});
