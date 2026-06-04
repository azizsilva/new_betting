"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { openGame } from "@/lib/casino-api";

// Full-screen game launcher: opens a Gamble Hub session for the gameId, then
// embeds the returned URL in an iframe. Opening is allowed at any balance —
// betting is enforced server-side via the seamless wallet callback.
export default function PlayGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    openGame(decodeURIComponent(gameId))
      .then((res) => {
        if (!cancelled) setUrl(res.url);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e?.response?.data?.message || e?.message || "Could not open the game.");
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
        <span className="text-sm font-semibold text-fg/80">Game</span>
        <button
          onClick={() => router.push("/casino")}
          className="flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-sm font-medium text-fg hover:text-danger"
          aria-label="Exit game"
        >
          <X className="size-4" /> Exit
        </button>
      </div>

      <div className="relative flex-1">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted">
            <AlertTriangle className="size-8 text-danger" />
            <p className="max-w-sm px-6 text-sm">{error}</p>
            <button
              onClick={() => router.push("/casino")}
              className="rounded-lg bg-gold-gradient px-4 py-2 text-sm font-bold text-brand-foreground"
            >
              Back to casino
            </button>
          </div>
        ) : !url ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-gold" />
          </div>
        ) : (
          <iframe
            src={url}
            title="Casino game"
            className="size-full border-0"
            allow="autoplay; fullscreen; payment"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
