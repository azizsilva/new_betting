"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { openGame } from "@/lib/casino-api";
import { fetchMe } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";

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
  const searchParams = useSearchParams();
  const accParam = searchParams.get("account");
  const account: "slots" | "live" | "gambly" =
    accParam === "live" ? "live" : accParam === "gambly" ? "gambly" : "slots";
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const openLoginModal = useUiStore((s) => s.openLoginModal);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pull the latest balance from the server and update the store (no reload).
  const refreshBalance = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      /* ignore — balance just stays as-is */
    }
  }, [setUser]);

  // While in-game, refresh the balance periodically so bets/wins reflect live,
  // and once more when the tab regains focus or the player navigates away.
  useEffect(() => {
    if (!url) return;
    const id = setInterval(refreshBalance, 8000);
    const onVis = () => document.visibilityState === "visible" && refreshBalance();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      void refreshBalance(); // final sync on unmount (exit)
    };
  }, [url, refreshBalance]);

  const [isExiting, setIsExiting] = useState(false);

  // Exit → sync balance first, then leave (header shows the cut balance instantly).
  const exit = useCallback(async () => {
    if (isExiting) return;
    setIsExiting(true);
    await refreshBalance();
    router.push("/casino");
  }, [refreshBalance, router, isExiting]);

  useEffect(() => {
    // Safety net behind the card-level gate: guests can't open a session.
    if (!accessToken) {
      toast.error("Please log in to play");
      openLoginModal();
      router.replace("/casino");
      return;
    }

    let cancelled = false;
    openGame(decodeURIComponent(gameId), { account })
      .then((res) => {
        if (!cancelled) setUrl(res.url);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e?.response?.status === 401) {
          toast.error("Please log in to play");
          openLoginModal();
          router.replace("/casino");
          return;
        }
        // Provider rejects games for disabled providers with a 400. Show a clean,
        // friendly message instead of the raw "Request failed with status code 400".
        const status = e?.response?.status;
        const providerMsg = e?.response?.data?.message as string | undefined;
        const friendly =
          status === 403
            ? "Seuls les joueurs peuvent ouvrir les jeux."
            : status === 400
              ? "Ce jeu n'est pas disponible pour le moment. Essayez un autre jeu."
              : providerMsg || e?.message || "Impossible d'ouvrir le jeu.";
        setError(friendly);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, account, accessToken, openLoginModal, router]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
        <span className="text-sm font-semibold text-fg/80">Game</span>
        <button
          onClick={exit}
          disabled={isExiting}
          className="flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-sm font-medium text-fg hover:text-danger disabled:opacity-50"
          aria-label="Exit game"
        >
          {isExiting ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} 
          {isExiting ? "Syncing..." : "Exit"}
        </button>
      </div>

      <div className="relative flex-1">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted">
            <AlertTriangle className="size-8 text-danger" />
            <p className="max-w-sm px-6 text-sm">{error}</p>
            <button
              onClick={exit}
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
