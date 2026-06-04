import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CasinoHero } from "@/components/casino/casino-hero";
import { CasinoBrowser } from "@/components/casino/casino-browser";
import { GameGridSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Casino — Slots, Live Casino & Instant Games",
  description:
    "Play thousands of casino games on BetSlate — top slots, live casino tables, Megaways, bonus-buy and crash games from the best providers.",
};

export default function CasinoPage() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-4 sm:px-6">
        <CasinoHero />
        <Suspense fallback={<GameGridSkeleton count={10} />}>
          <CasinoBrowser />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
