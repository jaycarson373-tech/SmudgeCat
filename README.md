# Smudge the Cat

Community landing page for **Smudge**, the famous white table cat behind the
“Woman Yelling at a Cat” meme. The site features Smudge’s story, meme history,
a $5,000 support thermometer, a transparent future-fee mission, and links to
Smudge’s official accounts, merch, direct support, and featured rescue charity.

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

## Built With

- Next.js
- React
- vinext
