"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Heart, Loader2 } from "lucide-react";
import type { Game } from "@/lib/games";
import { cn } from "@/lib/utils";

export function CasinoGameCard({ game, large }: { game: Game; large?: boolean }) {
  const router = useRouter();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [launching, setLaunching] = useState(false);

  // Launch routes to the play page, which opens the session + renders the iframe.
  function launch() {
    if (launching) return;
    setLaunching(true);
    router.push(`/casino/play/${encodeURIComponent(game.gameId ?? game.id)}`);
  }

  return (
    <button
      onClick={launch}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl border border-white/5 text-left",
        large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[4/5]",
      )}
    >
      {/* thumbnail or gradient placeholder */}
      {game.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider images come from arbitrary hosts
        <img
          src={game.imageUrl}
          alt={game.name}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", game.hue)} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* tags */}
      {game.tags.includes("new") && (
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
          NEW
        </span>
      )}

      {/* hover overlay: play + like */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="grid size-12 place-items-center rounded-full bg-gold-gradient text-brand-foreground gold-glow">
          {launching ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setLiked((v) => !v);
            setLikes((n) => (liked ? n - 1 : n + 1));
          }}
          className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold"
        >
          <Heart className={cn("size-3.5", liked ? "fill-danger text-danger" : "text-fg")} />
          {likes}
        </span>
      </div>

      {/* name + provider */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className={cn("truncate font-bold leading-tight", large ? "text-lg" : "text-sm")}>
          {game.name}
        </div>
        <div className="truncate text-[11px] text-fg/70">{game.provider}</div>
      </div>
    </button>
  );
}
