import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { IconSprite } from "@/components/icon-sprite";
import { MobileShell } from "@/components/layout/mobile-shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = {
  name: "BetSlate",
  description:
    "BetSlate — live sports betting & online casino. Real-time odds across football, cricket, tennis and more, plus thousands of casino games.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://betslate.example",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Live Sports Betting & Casino`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "sports betting",
    "live odds",
    "casino",
    "football betting",
    "cricket betting",
    "online casino",
  ],
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Live Sports Betting & Casino`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Live Sports Betting & Casino`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full">
        <IconSprite />
        <Providers>
          {children}
          <MobileShell />
        </Providers>
      </body>
    </html>
  );
}
