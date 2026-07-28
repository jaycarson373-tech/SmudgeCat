# Smudge the Table Cat

Community landing page for **Smudge the Table Cat**, the famous white cat
behind the “Woman Yelling at a Cat” meme. The site features Smudge’s story,
meme history, a $5,000 support thermometer, a transparent future-fee mission,
an interactive PFP studio, a downloadable art pack, an automated X reply bot,
and links to Smudge’s official accounts, merch, and direct support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: create the production build
- `npm test`: build and verify the rendered landing page

## Campaign settings

Copy `.env.example` to `.env.local` and fill in the public campaign values.
`NEXT_PUBLIC_RAISED_USD` moves the donation thermometer after a redeploy.

## PFP studio

The PFP studio runs entirely in the browser. Visitors can choose a Smudge art
style, background, hat, neckwear, and frame, then download a 1024 × 1024 PNG.
No login, wallet, or upload is required.

## X reply bot

The bot receives signed X webhook events at `/api/x-bot`, generates a
one-of-one Smudge PFP inspired by the tagging user’s current avatar, uploads the
result to X, and replies to the original post. Configure the bot variables in
`.env.example`, deploy, then run:

```bash
npm run bot:setup
```

The X app needs a webhook-capable API plan, media upload and post permissions,
and a user access token for the bot account. `KV_REST_API_URL` and
`KV_REST_API_TOKEN` provide durable duplicate protection for webhook retries.

## Built With

- Next.js
- React
- vinext
