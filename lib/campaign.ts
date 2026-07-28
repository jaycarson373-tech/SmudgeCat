export type CampaignStatus =
  | "raising"
  | "contacting"
  | "responded"
  | "donated";

const allowedStatuses: CampaignStatus[] = [
  "raising",
  "contacting",
  "responded",
  "donated",
];

const configuredStatus = process.env.NEXT_PUBLIC_CAMPAIGN_STATUS;
export const CAMPAIGN = {
  goalUsd: 5000,
  raisedUsd: Number(process.env.NEXT_PUBLIC_RAISED_USD ?? 0),
  careWallet: process.env.NEXT_PUBLIC_CARE_WALLET ?? "",
  status: allowedStatuses.includes(configuredStatus as CampaignStatus)
    ? (configuredStatus as CampaignStatus)
    : ("raising" as CampaignStatus),
  xUrl: process.env.NEXT_PUBLIC_X_URL || "https://x.com/SmudgeLord",
  tiktokUrl: "https://www.tiktok.com/@smudge_lord",
  instagramUrl: "https://www.instagram.com/smudge_lord/",
  facebookUrl: "https://www.facebook.com/smudgelordofficial",
  supportUrl: "https://www.paypal.me/smudgelord",
  merchUrl: "https://smudge-lord.com/",
  charityUrl: "https://www.furry-tales.ca/",
  linktreeUrl: "https://linktr.ee/Smudge_Lord",
};
