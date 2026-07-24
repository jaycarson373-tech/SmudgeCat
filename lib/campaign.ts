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
  goalUsd: 10000,
  raisedUsd: Number(process.env.NEXT_PUBLIC_RAISED_USD ?? 0),
  careWallet: process.env.NEXT_PUBLIC_CARE_WALLET ?? "",
  status: allowedStatuses.includes(configuredStatus as CampaignStatus)
    ? (configuredStatus as CampaignStatus)
    : ("raising" as CampaignStatus),
  ca: process.env.NEXT_PUBLIC_CA ?? "",
  pumpUrl: process.env.NEXT_PUBLIC_PUMP_URL ?? "",
  dexscreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? "",
  xUrl: process.env.NEXT_PUBLIC_X_URL ?? "",
  telegramUrl: process.env.NEXT_PUBLIC_TG_URL ?? "",
  tiktokUrl: "https://www.tiktok.com/@dinocattutu",
  instagramUrl: "https://www.instagram.com/dinocattutu/",
};
