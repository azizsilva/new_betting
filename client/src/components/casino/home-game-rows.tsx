"use client";

import { Cherry, Club } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Carousel } from "@/components/ui/carousel";
import { CasinoGameCard } from "./casino-game-card";
import { useGames } from "@/lib/use-games";
import { homeCasinoRow, homeLiveRow, type Game } from "@/lib/games";

const SLIDE = "w-[44%] sm:w-[31%] lg:w-[15%]";

function RowSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`${SLIDE} shrink-0`}>
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface" />
        </div>
      ))}
    </div>
  );
}

function Row({
  icon,
  title,
  href,
  games,
  isLoading,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  games: Game[];
  isLoading: boolean;
}) {
  if (!isLoading && games.length === 0) return null;
  return (
    <Section>
      <SectionHeader icon={icon} title={title} actionLabel="Tous les jeux" actionHref={href} />
      {isLoading ? (
        <RowSkeleton />
      ) : (
        <Carousel slideClassName={SLIDE}>
          {games.map((g) => (
            <CasinoGameCard key={g.id} game={g} />
          ))}
        </Carousel>
      )}
    </Section>
  );
}

// Curated "Jeux de casino" row (fixed picks + local art).
export function HomeCasinoRow() {
  const { games, isLoading } = useGames();
  return (
    <Row
      icon={<Cherry className="size-5 text-gold" />}
      title="Jeux de casino"
      href="/casino?tab=casino"
      games={homeCasinoRow(games)}
      isLoading={isLoading}
    />
  );
}

// Curated "Jeux en direct" row (fixed picks + local art).
export function HomeLiveRow() {
  const { games, isLoading } = useGames();
  return (
    <Row
      icon={<Club className="size-5 text-gold" />}
      title="Jeux en direct"
      href="/casino?tab=live-casino"
      games={homeLiveRow(games)}
      isLoading={isLoading}
    />
  );
}
