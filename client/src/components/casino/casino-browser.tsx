"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { Heart, Crown, Tag, Rocket, ChevronDown, Search, X } from "lucide-react";
import { QUICK_FILTERS, type Game, type GameTab } from "@/lib/games";
import { useGames } from "@/lib/use-games";
import { CasinoGameCard } from "./casino-game-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS: { id: GameTab; label: string }[] = [
  { id: "casino", label: "Casino" },
  { id: "live-casino", label: "Live Casino" },
  { id: "instant", label: "Instant" },
];

const QUICK_ICONS: Record<string, typeof Heart> = {
  all: Heart,
  new: Heart,
  megaways: Crown,
  "bonus-buy": Tag,
  crash: Rocket,
};

const PAGE_SIZE = 30;

export function CasinoBrowser() {
  // URL-backed state — shareable & back-button safe.
  const [tab, setTab] = useQueryState("tab", { defaultValue: "casino", clearOnDefault: true });
  const [q, setQ] = useQueryState("q", { defaultValue: "", clearOnDefault: true });
  const [quick, setQuick] = useQueryState("filter", { defaultValue: "all", clearOnDefault: true });
  const [provider, setProvider] = useQueryState("provider", { defaultValue: "", clearOnDefault: true });

  // Local debounced search input.
  const [search, setSearch] = useState(q);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Shared live catalog (same query as the homepage rows → fetched once, cached).
  const { games, isLoading, isError } = useGames();
  const providers = useMemo(
    () => Array.from(new Set(games.map((g) => g.provider))).sort(),
    [games],
  );

  // Debounce writes to the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== q) {
        setQ(search || null);
        setVisible(PAGE_SIZE);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Keep input synced if the URL changes externally.
  useEffect(() => setSearch(q), [q]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return games.filter((g) => {
      if (g.tab !== tab) return false;
      if (quick !== "all" && !g.tags.includes(quick as never)) return false;
      if (provider && g.provider !== provider) return false;
      if (term && !g.name.toLowerCase().includes(term) && !g.provider.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [games, tab, q, quick, provider]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-line bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id === "casino" ? null : t.id);
              setVisible(PAGE_SIZE);
            }}
            className={cn(
              "flex-1 rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-wide transition-colors",
              tab === t.id
                ? "bg-gold-gradient text-brand-foreground"
                : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Sweet Bonanza"
            className="h-11 w-full rounded-lg border border-line bg-bg-elevated pl-10 pr-10 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Quick filters */}
          <div>
            <div className="mb-2 text-xs font-semibold text-muted">Quick select:</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_FILTERS.map((f) => {
                const Icon = QUICK_ICONS[f.id] ?? Heart;
                const active = quick === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setQuick(f.id === "all" ? null : f.id);
                      setVisible(PAGE_SIZE);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-line bg-bg-elevated text-fg hover:border-gold/40",
                    )}
                  >
                    <Icon className="size-4 text-gold" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider dropdown */}
          <div className="lg:w-56">
            <div className="mb-2 text-xs font-semibold text-muted">Providers:</div>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value || null);
                  setVisible(PAGE_SIZE);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-line bg-bg-elevated px-3 pr-9 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <option value="">All providers</option>
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="rounded-2xl border border-line bg-surface py-16 text-center text-muted">
          Loading games…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-line bg-surface py-16 text-center text-muted">
          Couldn’t load games. Please try again.
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface py-16 text-center text-muted">
          No games match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 lg:gap-3 [grid-auto-rows:1fr] [grid-auto-flow:row_dense]">
          {shown.map((g) => (
            <div
              key={g.id}
              className={cn(
                g.featured
                  ? "col-span-2 row-span-2"
                  : "col-span-1 row-span-1",
              )}
            >
              <CasinoGameCard game={g} large={g.featured} />
            </div>
          ))}
        </div>
      )}

      {/* Counter + load more */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="h-1 w-40 rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gold-gradient"
            style={{ width: `${Math.min(100, (shown.length / Math.max(filtered.length, 1)) * 100)}%` }}
          />
        </div>
        <p className="text-sm text-muted">
          {shown.length} games of {filtered.length.toLocaleString()} loaded
        </p>
        {visible < filtered.length && (
          <Button variant="brand" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Load more games
          </Button>
        )}
      </div>
    </div>
  );
}
