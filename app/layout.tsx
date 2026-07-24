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
  title: "Tutu — The Dino Cat",
  description:
    "The internet’s most famous pawless cat. All trading fees are donated to help Tutu live a better life.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Tutu — The Dino Cat",
    description:
      "The internet’s most famous pawless cat. 100% of fees go toward a $10,000 goal for Tutu.",
    type: "website",
    images: [
      {
        url: "/tutu-banner.jpg",
        width: 1600,
        height: 532,
        alt: "Tutu the Dino Cat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutu — The Dino Cat",
    description:
      "The internet’s most famous pawless cat. 100% of fees go toward a $10,000 goal for Tutu.",
    images: ["/tutu-banner.jpg"],
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
