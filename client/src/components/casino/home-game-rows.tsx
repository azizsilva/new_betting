"use client";

import { Cherry, Club, Zap } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Carousel } from "@/components/ui/carousel";
import { CasinoGameCard } from "./casino-game-card";
import { useGames } from "@/lib/use-games";
import type { Game, GameTab } from "@/lib/games";

// Cap per carousel — the row is horizontal, so a handful is plenty and keeps the
// homepage light. The full list lives on /casino.
const ROW_LIMIT = 18;
const SLIDE = "w-[44%] sm:w-[31%] lg:w-[15%]";

function RowSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`${SLIDE} shrink-0`}>
          {/* matches the card aspect (square) so there's no layout shift */}
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface" />
        </div>
      ))}
    </div>
  );
}

function GameRow({
  icon,
  title,
  actionLabel,
  tab,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  actionLabel: string;
  tab: GameTab;
  href: string;
}) {
  const { isLoading, byTab } = useGames();
  const games: Game[] = byTab(tab).slice(0, ROW_LIMIT);

  // Render nothing for an empty category once loaded — no empty boxes.
  if (!isLoading && games.length === 0) return null;

  return (
    <Section>
      <SectionHeader icon={icon} title={title} actionLabel={actionLabel} actionHref={href} />
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

// Live homepage rows, split by category, sharing the cached catalog with /casino.
export function HomeGameRows() {
  return (
    <>
      <GameRow
        icon={<Cherry className="size-5 text-gold" />}
        title="Jeux de casino"
        actionLabel="Tous les jeux"
        tab="casino"
        href="/casino?tab=casino"
      />
      <GameRow
        icon={<Club className="size-5 text-gold" />}
        title="Jeux en direct"
        actionLabel="Tous les jeux"
        tab="live-casino"
        href="/casino?tab=live-casino"
      />
      <GameRow
        icon={<Zap className="size-5 text-gold" />}
        title="Jeux instantanés"
        actionLabel="Tous les jeux"
        tab="instant"
        href="/casino?tab=instant"
      />
    </>
  );
}
