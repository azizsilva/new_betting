import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { IconSprite } from "@/components/icon-sprite";
import { MobileShell } from "@/components/layout/mobile-shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = {
  name: "AfroBet216",
  description:
    "AfroBet216 — paris sportifs en direct & casino en ligne. Cotes en temps réel sur le football, le tennis et plus, plus des milliers de jeux de casino, machines à sous et casino live (Evolution).",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://afrobet216.com",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Paris Sportifs en Direct & Casino en Ligne`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "afrobet216",
    "paris sportifs",
    "casino en ligne",
    "machines à sous",
    "casino live",
    "evolution gaming",
    "slots",
    "cotes en direct",
    "sports betting",
    "online casino",
  ],
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "fr_FR",
    title: `${SITE.name} — Paris Sportifs en Direct & Casino en Ligne`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Paris Sportifs en Direct & Casino en Ligne`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
