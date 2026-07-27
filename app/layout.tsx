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
  : "https://dinocat-jaycarson373-7760s-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: "Smudge on Solana | $SMUDGE",
  description:
    "The cat behind one of the internet’s most famous memes. Future creator fees support Smudge and rescue cats through verified official channels.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/smudge-favicon.png",
    shortcut: "/smudge-favicon.png",
    apple: "/smudge-apple-touch-icon.png",
  },
  openGraph: {
    title: "Smudge on Solana | $SMUDGE",
    description:
      "He no like vegetals. He does like memes. Meet Smudge, the table cat who became internet history.",
    type: "website",
    url: "/",
    siteName: "$SMUDGE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smudge on Solana | $SMUDGE",
    description:
      "He no like vegetals. He does like memes. Meet Smudge, the table cat who became internet history.",
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
