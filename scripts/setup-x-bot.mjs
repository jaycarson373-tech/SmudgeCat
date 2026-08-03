const required = [
  "X_APP_BEARER_TOKEN",
  "X_BOT_HANDLE",
  "BOT_WEBHOOK_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required`);
  }
}

const bearer = process.env.X_APP_BEARER_TOKEN;
const handle = process.env.X_BOT_HANDLE.replace(/^@/, "");
const webhookUrl = process.env.BOT_WEBHOOK_URL;

async function xRequest(path, init = {}) {
  const response = await fetch(`https://api.x.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      body.detail ??
        body.errors?.[0]?.detail ??
        body.errors?.[0]?.message ??
        `X API returned ${response.status}`,
    );
  }
  return body;
}

const webhook = await xRequest("/2/webhooks", {
  method: "POST",
  body: JSON.stringify({ url: webhookUrl }),
});

await xRequest("/2/tweets/search/stream/rules", {
  method: "POST",
  body: JSON.stringify({
    add: [
      {
        value: `@${handle} -is:retweet -from:${handle}`,
        tag: "timon-pfp-request",
      },
    ],
  }),
});

await xRequest(
  `/2/tweets/search/webhooks/${encodeURIComponent(
    webhook.data?.id ?? webhook.id,
  )}?expansions=author_id&user.fields=id,name,username,profile_image_url`,
  { method: "POST" },
);

console.log("Timon bot webhook and mention rule are active.");
