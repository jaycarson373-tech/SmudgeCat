import { after } from "next/server";

export const maxDuration = 300;

type Mention = {
  id: string;
  authorId: string;
  username: string;
  profileImageUrl: string;
};

type XUser = {
  id?: string;
  id_str?: string;
  username?: string;
  screen_name?: string;
  profile_image_url?: string;
  profile_image_url_https?: string;
};

type FilteredStreamPayload = {
  data?: {
    id?: string;
    author_id?: string;
  };
  includes?: {
    users?: XUser[];
  };
  tweet_create_events?: Array<{
    id?: string;
    id_str?: string;
    user?: XUser;
  }>;
};

const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function hmacBase64(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return bytesToBase64(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function highResolutionProfileImage(url: string) {
  return url.replace(/_normal(?=\.[a-z]+(?:\?|$))/i, "_400x400");
}

function extractMentions(payload: FilteredStreamPayload): Mention[] {
  const mentions: Mention[] = [];
  const botUserId = process.env.X_BOT_USER_ID;

  if (payload.data?.id && payload.data.author_id) {
    const author = payload.includes?.users?.find(
      (user) => (user.id ?? user.id_str) === payload.data?.author_id,
    );
    const profileImageUrl =
      author?.profile_image_url_https ?? author?.profile_image_url ?? "";
    const username = author?.username ?? author?.screen_name ?? "";
    if (
      payload.data.author_id !== botUserId &&
      username &&
      profileImageUrl
    ) {
      mentions.push({
        id: payload.data.id,
        authorId: payload.data.author_id,
        username,
        profileImageUrl: highResolutionProfileImage(profileImageUrl),
      });
    }
  }

  for (const event of payload.tweet_create_events ?? []) {
    const id = event.id_str ?? event.id ?? "";
    const authorId = event.user?.id_str ?? event.user?.id ?? "";
    const username = event.user?.screen_name ?? event.user?.username ?? "";
    const profileImageUrl =
      event.user?.profile_image_url_https ??
      event.user?.profile_image_url ??
      "";
    if (id && authorId !== botUserId && username && profileImageUrl) {
      mentions.push({
        id,
        authorId,
        username,
        profileImageUrl: highResolutionProfileImage(profileImageUrl),
      });
    }
  }

  return mentions;
}

async function claimMention(id: string) {
  const redisUrl =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const redisToken =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${redisToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        "SET",
        `smudge-bot:${id}`,
        "processing",
        "NX",
        "EX",
        "86400",
      ]),
    });
    if (!response.ok) {
      throw new Error(`Bot dedupe store returned ${response.status}`);
    }
    const body = (await response.json()) as { result?: string | null };
    return body.result === "OK";
  }

  const runtime = globalThis as typeof globalThis & {
    __smudgeMentions?: Set<string>;
  };
  runtime.__smudgeMentions ??= new Set<string>();
  if (runtime.__smudgeMentions.has(id)) return false;
  runtime.__smudgeMentions.add(id);
  return true;
}

async function generateSmudgedPfp(mention: Mention, smudgeImageUrl: string) {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      authorization: `Bearer ${openAiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
      prompt: [
        "Create a square, circle-safe Smudge the Table Cat profile picture.",
        "The second reference image is the identity reference for Smudge: preserve his white fur, skeptical squint, pink nose, pointed ears, and iconic unbothered expression.",
        "Use the first reference image only as creative inspiration for the new PFP's outfit, colors, props, mood, and background.",
        "Do not reproduce or retain a human face. The final subject must be Smudge the white cat.",
        "Center Smudge's face, keep both ears inside the crop, use a bold clean background, and make the image readable as a tiny X avatar.",
        "No words, letters, logos, watermarks, salad, or extra animals.",
      ].join(" "),
      images: [
        { image_url: mention.profileImageUrl },
        { image_url: smudgeImageUrl },
      ],
      size: "1024x1024",
      quality: "medium",
      output_format: "jpeg",
      output_compression: 86,
    }),
  });

  const body = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string };
  };
  if (!response.ok || !body.data?.[0]?.b64_json) {
    throw new Error(
      body.error?.message ?? `Image generation returned ${response.status}`,
    );
  }
  return body.data[0].b64_json;
}

async function uploadImageToX(imageBase64: string) {
  const userToken = process.env.X_USER_ACCESS_TOKEN;
  if (!userToken) throw new Error("X_USER_ACCESS_TOKEN is not configured");

  const response = await fetch("https://api.x.com/2/media/upload", {
    method: "POST",
    headers: {
      authorization: `Bearer ${userToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      media: imageBase64,
      media_category: "tweet_image",
      media_type: "image/jpeg",
      shared: false,
    }),
  });
  const body = (await response.json()) as {
    data?: { id?: string };
    errors?: Array<{ detail?: string; title?: string }>;
  };
  const mediaId = body.data?.id;
  if (!response.ok || !mediaId) {
    throw new Error(
      body.errors?.[0]?.detail ??
        body.errors?.[0]?.title ??
        `X media upload returned ${response.status}`,
    );
  }
  return mediaId;
}

async function replyWithPfp(mention: Mention, mediaId: string) {
  const userToken = process.env.X_USER_ACCESS_TOKEN;
  if (!userToken) throw new Error("X_USER_ACCESS_TOKEN is not configured");

  const siteUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  const text = [
    `@${mention.username} you have been Smudged.`,
    "He no like vegetals.",
    "100% of creator fees are reserved for Smudge and his owner.",
    siteUrl ? `Make yours: ${siteUrl}/#pfp` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${userToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      media: { media_ids: [mediaId] },
      reply: { in_reply_to_tweet_id: mention.id },
    }),
  });
  if (!response.ok) {
    const body = (await response.json()) as {
      detail?: string;
      errors?: Array<{ detail?: string; message?: string }>;
    };
    throw new Error(
      body.detail ??
        body.errors?.[0]?.detail ??
        body.errors?.[0]?.message ??
        `X reply returned ${response.status}`,
    );
  }
}

async function processMention(mention: Mention, origin: string) {
  if (!(await claimMention(mention.id))) return;
  const imageBase64 = await generateSmudgedPfp(
    mention,
    new URL("/smudge-pfp-studio.png", origin).href,
  );
  const mediaId = await uploadImageToX(imageBase64);
  await replyWithPfp(mention, mediaId);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const crcToken = url.searchParams.get("crc_token");
  const consumerSecret = process.env.X_API_CONSUMER_SECRET;

  if (!crcToken) {
    return Response.json({
      service: "Smudge PFP bot",
      configured: Boolean(
        consumerSecret &&
          process.env.X_USER_ACCESS_TOKEN &&
          process.env.OPENAI_API_KEY,
      ),
    });
  }
  if (!consumerSecret) {
    return Response.json(
      { error: "Webhook secret is not configured" },
      { status: 503 },
    );
  }

  const signature = await hmacBase64(consumerSecret, crcToken);
  return Response.json({ response_token: `sha256=${signature}` });
}

export async function POST(request: Request) {
  const consumerSecret = process.env.X_API_CONSUMER_SECRET;
  if (!consumerSecret) {
    return Response.json(
      { error: "Webhook secret is not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const receivedSignature =
    request.headers.get("x-twitter-webhooks-signature") ?? "";
  const expectedSignature = `sha256=${await hmacBase64(
    consumerSecret,
    rawBody,
  )}`;

  if (!timingSafeEqual(receivedSignature, expectedSignature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as FilteredStreamPayload;
  const mentions = extractMentions(payload);
  const origin = new URL(request.url).origin;

  after(async () => {
    const results = await Promise.allSettled(
      mentions.map((mention) => processMention(mention, origin)),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Smudge bot failed to process a mention", result.reason);
      }
    }
  });

  return Response.json({ accepted: true, mentions: mentions.length });
}
