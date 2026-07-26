import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://dinocat-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: "Rigby | The Fainting Goat Cat",
  description:
    "One of the world’s most viral cats is running on Solana. 100% of fees support Rigby through official Cameos and merch.",
  icons: {
    icon: "/rigby-avatar.png",
    shortcut: "/rigby-avatar.png",
    apple: "/rigby-avatar.png",
  },
  openGraph: {
    title: "Rigby | The Fainting Goat Cat",
    description:
      "Nearly 3 million TikTok followers, one legendary blep, and 100% of fees supporting Rigby.",
    type: "website",
    images: [
      {
        url: "/rigby-og.png",
        width: 1731,
        height: 909,
        alt: "Rigby, the fainting goat cat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rigby | The Fainting Goat Cat",
    description:
      "Nearly 3 million TikTok followers, one legendary blep, and 100% of fees supporting Rigby.",
    images: ["/rigby-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
