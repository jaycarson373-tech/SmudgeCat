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

export const metadata: Metadata = {
  title: "Smudge the Table Cat | $SMUDGE",
  description:
    "Smudge the Table Cat is the white cat behind one of the internet’s most famous memes. Future creator fees support Smudge and rescue cats through verified official channels.",
  icons: {
    icon: "/smudge-favicon.png",
    shortcut: "/smudge-favicon.png",
    apple: "/smudge-apple-touch-icon.png",
  },
  openGraph: {
    title: "Smudge the Table Cat | $SMUDGE",
    description:
      "He no like vegetals. He does like memes. Meet Smudge the Table Cat, an internet icon on Solana.",
    type: "website",
    siteName: "Smudge the Table Cat",
    images: [
      {
        url: "https://dinocat-nine.vercel.app/og.png",
        width: 1200,
        height: 630,
        alt: "Smudge the Table Cat sitting behind a plate of salad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smudge the Table Cat | $SMUDGE",
    description:
      "He no like vegetals. He does like memes. Meet Smudge the Table Cat, an internet icon on Solana.",
    images: ["https://dinocat-nine.vercel.app/og.png"],
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
