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
const ca = process.env.NEXT_PUBLIC_CA || "";

export const CAMPAIGN = {
  goalUsd: 10000,
  raisedUsd: Number(process.env.NEXT_PUBLIC_RAISED_USD ?? 0),
  careWallet: process.env.NEXT_PUBLIC_CARE_WALLET ?? "",
  status: allowedStatuses.includes(configuredStatus as CampaignStatus)
    ? (configuredStatus as CampaignStatus)
    : ("raising" as CampaignStatus),
  ca,
  pumpUrl:
    process.env.NEXT_PUBLIC_PUMP_URL ||
    (ca ? `https://pump.fun/coin/${ca}` : ""),
  jupiterUrl:
    process.env.NEXT_PUBLIC_JUPITER_URL ||
    (ca ? `https://jup.ag/swap/SOL-${ca}` : ""),
  dexscreenerUrl:
    process.env.NEXT_PUBLIC_DEXSCREENER_URL ||
    (ca ? `https://dexscreener.com/solana/${ca}` : ""),
  xUrl: process.env.NEXT_PUBLIC_X_URL ?? "",
  telegramUrl: process.env.NEXT_PUBLIC_TG_URL ?? "",
  tiktokUrl: "https://www.tiktok.com/@iamrigbycat",
  instagramUrl: "https://www.instagram.com/iamrigbycat/",
  cameoUrl: "https://www.cameo.com/iamrigbycat",
  merchUrl: "https://rigbycat.dashery.com/",
  youtubeUrl: "https://www.youtube.com/@iamrigbycat",
  linktreeUrl: "https://linktr.ee/iamrigbycat",
};
