export type CampaignStatus = "raising" | "contacting" | "responded" | "donated";

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
  botHandle: process.env.NEXT_PUBLIC_BOT_HANDLE ?? "",
  xUrl: process.env.NEXT_PUBLIC_X_URL || "https://x.com/timonsurik",
  tiktokUrl: "https://www.tiktok.com/@timon.surik",
  instagramUrl: "https://www.instagram.com/timon.surik/",
  taplinkUrl: "https://taplink.cc/timonsurik",
};
