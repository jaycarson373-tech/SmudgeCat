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
  title: "2-2 — The Dino Cat",
  description:
    "Meet Tutu, the two-legged Dino Cat beloved by millions. 100% of fees go toward giving him a better life.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "2-2 — The Dino Cat",
    description:
      "Two back legs. One giant heart. Zero quit. Meet the internet’s Dino Cat.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "2-2 — The Dino Cat",
    description:
      "Two back legs. One giant heart. Zero quit. Meet the internet’s Dino Cat.",
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
