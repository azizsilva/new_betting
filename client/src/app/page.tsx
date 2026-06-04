import { Cherry, Club } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { Jackpots } from "@/components/home/jackpots";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Promotions } from "@/components/home/promotions";
import { Section, SectionHeader } from "@/components/ui/section";
import { Carousel } from "@/components/ui/carousel";
import { GameCard } from "@/components/casino/game-card";
import { CASINO_GAMES, LIVE_CASINO } from "@/lib/mock";
import { LatestWins } from "@/components/home/latest-wins";

export default function HomePage() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />

      {/* Centered content container with visible side margins (kingsbet-style). */}
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-4 sm:px-6">
        {/* Hero breaks out of the side padding to sit edge-to-edge on mobile. */}
        <div className="-mx-4 sm:mx-0">
          <Hero />
        </div>
        <Jackpots />
        <CategoryTiles />

        {/* Casino games */}
        <Section>
          <SectionHeader
            icon={<Cherry className="size-5 text-gold" />}
            title="Casino Games"
            actionLabel="All games"
            actionHref="/casino"
          />
          <Carousel slideClassName="w-[44%] sm:w-[31%] lg:w-[15%]">
            {CASINO_GAMES.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </Carousel>
        </Section>

        {/* Promotions */}
        <Promotions />

        {/* Live casino */}
        <Section>
          <SectionHeader
            icon={<Club className="size-5 text-gold" />}
            title="Live Games"
            actionLabel="All games"
            actionHref="/live-casino"
          />
          <Carousel slideClassName="w-[44%] sm:w-[31%] lg:w-[15%]">
            {LIVE_CASINO.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </Carousel>
        </Section>

        {/* Latest Wins */}
        <div className="pt-4">
          <LatestWins />
        </div>
      </main>
      <Footer />
    </div>
  );
}
