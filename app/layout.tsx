import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://zazu-still-staring.vercel.app",
  ),
  title: "$ZAZU | The Stare That Burns Back",
  description: "ZAZU's creator-fee share is reserved for recurring buybacks and permanent burns on Robinhood Chain, targeting 15-minute intervals when fees are available.",
  icons: {
    icon: "/zazu-favicon.png",
    shortcut: "/zazu-favicon.png",
    apple: "/zazu-apple-touch-icon.png",
  },
  openGraph: {
    title: "$ZAZU | The Stare That Burns Back",
    description: "Built on Robinhood Chain and launching through Pons. Creator-fee buybacks target 15-minute intervals when fees are available.",
    type: "website",
    siteName: "Zazu",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "$ZAZU, the stare that burns back" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "$ZAZU | The Stare That Burns Back",
    description: "Built on Robinhood Chain and launching through Pons. Creator-fee buybacks target 15-minute intervals when fees are available.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
