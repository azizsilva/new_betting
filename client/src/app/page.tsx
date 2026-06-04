import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { Jackpots } from "@/components/home/jackpots";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Promotions } from "@/components/home/promotions";
import { HomeGameRows } from "@/components/casino/home-game-rows";
import { LatestWins } from "@/components/home/latest-wins";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://afrobet216.com";

// Structured data → richer Google results (org + site search box).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "AfroBet216",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    {
      "@type": "WebSite",
      name: "AfroBet216",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/casino?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      {/* Centered content container with visible side margins (kingsbet-style). */}
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-4 sm:px-6">
        {/* Hero breaks out of the side padding to sit edge-to-edge on mobile. */}
        <div className="-mx-4 sm:mx-0">
          <Hero />
        </div>
        <Jackpots />
        <CategoryTiles />

        {/* Live game rows (Casino / Live / Instant), split by category and
            sharing the cached catalog with /casino. */}
        <HomeGameRows />

        {/* Promotions */}
        <Promotions />

        {/* Latest Wins */}
        <div className="pt-4">
          <LatestWins />
        </div>
      </main>
      <Footer />
    </div>
  );
}
