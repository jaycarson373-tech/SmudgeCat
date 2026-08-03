# Timon the Meerkat

Community landing page for **Timon the Meerkat**, the viral animal creator at
[@timon.surik](https://www.tiktok.com/@timon.surik). The site includes Timon's
story, TikTok milestones, a $5,000 support meter, an interactive PFP studio,
four downloadable art styles, an optional automated X reply bot, and verified
social links.

## Prerequisites

- Node.js `>=22.13.0`

## Quick start

```bash
npm install
npm run dev
npm run build
```

## Campaign settings

Copy `.env.example` to `.env.local` and fill in the public campaign values.
`NEXT_PUBLIC_RAISED_USD` moves the support meter after a redeploy.

## PFP studio

The PFP studio runs entirely in the browser. Visitors can choose a Timon art
style, background, hat, eyewear, neckwear, and frame, then download a 1024 by
1024 PNG. No login, wallet, or upload is required.

## X reply bot

The bot receives signed X webhook events at `/api/x-bot`, generates a
one-of-one Timon PFP inspired by the tagging user's current avatar, uploads the
result to X, and replies to the original post. Configure the bot variables in
`.env.example`, deploy, then run:

```bash
npm run bot:setup
```

The X app needs a webhook-capable API plan, media upload and post permissions,
and a user access token for the bot account. Redis-compatible REST variables
provide durable duplicate protection for webhook retries.

## Built with

- Next.js
- React
- vinext
