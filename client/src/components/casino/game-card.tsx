import { Play } from "lucide-react";
import type { CasinoTile } from "@/lib/mock";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GameCard({ game }: { game: CasinoTile }) {
  return (
    <button className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line bg-surface text-left">
      <div className={cn("absolute inset-0 bg-gradient-to-br", game.hue)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

      {game.tag && (
        <div className="absolute left-2 top-2">
          <Badge variant={game.tag === "LIVE" ? "live" : game.tag === "NEW" ? "brand" : "gold"}>
            {game.tag}
          </Badge>
        </div>
      )}

      {/* Hover play */}
      <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
        <span className="grid size-12 place-items-center rounded-full bg-brand text-brand-foreground brand-glow">
          <Play className="size-5 fill-current" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="truncate text-sm font-semibold">{game.name}</div>
        <div className="truncate text-xs text-muted">{game.provider}</div>
      </div>
    </button>
  );
}
