"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import type { Game } from "@/lib/games";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

export function CasinoGameCard({ game, large }: { game: Game; large?: boolean }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const openLoginModal = useUiStore((s) => s.openLoginModal);
  const [launching, setLaunching] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(game.imageUrl) && !imgError;

  // Launch requires login (real play). Guests get a toast + the login modal —
  // never the raw 401 page.
  function launch() {
    if (launching) return;
    if (!accessToken) {
      toast.error("Please log in to play");
      openLoginModal();
      return;
    }
    setLaunching(true);
    const acc = game.account ? `?account=${game.account}` : "";
    router.push(`/casino/play/${encodeURIComponent(game.gameId ?? game.id)}${acc}`);
  }

  return (
    <button
      onClick={launch}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl border border-white/5 bg-surface text-left",
        large ? "aspect-square lg:aspect-auto lg:h-full" : "aspect-square",
      )}
    >
      {/* gradient placeholder underneath — visible until the HD image decodes */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", game.hue)} />

      {/* The game art fills the whole card (kingsbet365 style) — the title is
          part of the artwork, so no text overlay when an image is present. */}
      {hasImage && (
        game.imageUrl?.endsWith(".svg") ? (
          /* SVGs with embedded images must use <object> — <img> sandboxes them
             and blocks internal <image xlink:href> / base64 resources */
          <object
            data={game.imageUrl}
            type="image/svg+xml"
            aria-label={game.name}
            onLoad={() => setLoaded(true)}
            onError={() => setImgError(true)}
            className={cn(
              "absolute inset-0 size-full pointer-events-none transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- provider images come from arbitrary hosts
          <img
            src={game.imageUrl}
            alt={game.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setImgError(true)}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )
      )}

      {/* NEW badge */}
      {game.tags.includes("new") && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
          NEW
        </span>
      )}

      {/* hover overlay: play button */}
      <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="grid size-12 place-items-center rounded-full bg-gold-gradient text-brand-foreground gold-glow">
          {launching ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
        </span>
      </div>

      {/* Name + provider label over a bottom gradient (kingsbet365 style). */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className={cn("truncate font-bold leading-tight", large ? "text-lg" : "text-sm")}>
          {game.name}
        </div>
        {game.provider && (
          <div className="truncate text-[11px] text-fg/70">{game.provider}</div>
        )}
      </div>
    </button>
  );
}
