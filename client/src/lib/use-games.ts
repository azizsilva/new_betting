"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchGames } from "./casino-api";
import { mapCatalog, type Game } from "./games";

// One shared catalog query for the whole app. The homepage rows and the /casino
// browser use the SAME queryKey, so the catalog is fetched once and reused
// instantly on navigation (no second network round-trip, no spinner).
export function useGames() {
  const query = useQuery({
    queryKey: ["casino-games"],
    queryFn: () => fetchGames(),
    staleTime: 5 * 60_000,   // don't refetch for 5 min after a successful load
    gcTime: 30 * 60_000,     // keep data in memory for 30 min (survives tab switches)
    refetchOnWindowFocus: false, // don't re-hit the API every time user alt-tabs back
    select: mapCatalog,
  });

  const games: Game[] = query.data ?? [];
  return {
    games,
    isLoading: query.isLoading,
    isError: query.isError,
    byTab: (tab: Game["tab"]) => games.filter((g) => g.tab === tab),
  };
}
