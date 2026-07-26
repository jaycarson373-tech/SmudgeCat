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
  ca: "",
  pumpUrl: "",
  jupiterUrl: "",
  dexscreenerUrl: "",
  xUrl:
    process.env.NEXT_PUBLIC_X_URL || "https://x.com/rigbycat_solana",
  telegramUrl: process.env.NEXT_PUBLIC_TG_URL ?? "",
  tiktokUrl: "https://www.tiktok.com/@iamrigbycat",
  instagramUrl: "https://www.instagram.com/iamrigbycat/",
  cameoUrl: "https://www.cameo.com/iamrigbycat",
  merchUrl: "https://rigbycat.dashery.com/",
  youtubeUrl: "https://www.youtube.com/@iamrigbycat",
  linktreeUrl: "https://linktr.ee/iamrigbycat",
};
