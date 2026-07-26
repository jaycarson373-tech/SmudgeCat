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
  : "https://www.rigbycatsolana.fun";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: "Rigby on Solana | $RIGBY",
  description:
    "One of the world’s most viral cats is launching on Solana. 100% of fees support Rigby through official Cameos and merch.",
  alternates: {
    canonical: "https://www.rigbycatsolana.fun",
  },
  icons: {
    icon: "/rigby-favicon.png",
    shortcut: "/rigby-favicon.png",
    apple: "/rigby-apple-touch-icon.png",
  },
  openGraph: {
    title: "Rigby on Solana | $RIGBY",
    description:
      "3 million TikTok followers, over 1 billion total views, and 100% of fees supporting Rigby. The blep is launching on Solana.",
    type: "website",
    url: "https://www.rigbycatsolana.fun",
    siteName: "$RIGBY",
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
    title: "Rigby on Solana | $RIGBY",
    description:
      "3 million TikTok followers, over 1 billion total views, and 100% of fees supporting Rigby. The blep is launching on Solana.",
    creator: "@rigbycat_solana",
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
