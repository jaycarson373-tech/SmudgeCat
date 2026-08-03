import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://timon-the-meerkat.vercel.app",
  ),
  title: "Timon the Meerkat | $TIMON",
  description: "Build and download a custom Timon PFP. 100% of creator fees are reserved for Timon the Meerkat and his owner.",
  icons: {
    icon: "/timon-favicon.png",
    shortcut: "/timon-favicon.png",
    apple: "/timon-apple-touch-icon.png",
  },
  openGraph: {
    title: "Timon the Meerkat | $TIMON",
    description: "Make a custom Timon PFP with hats, shades, backgrounds, and more. Download it free.",
    type: "website",
    siteName: "Timon the Meerkat",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Timon the Meerkat wearing his yellow hat and black sunglasses" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Timon the Meerkat | $TIMON",
    description: "Build your Timon PFP. Hats, shades, backgrounds, and instant downloads.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
