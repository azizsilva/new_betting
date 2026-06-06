import { api } from "./api";
import type { CatalogGame } from "./games";

export interface OpenGameResult {
  url: string;
  sessionId: string;
}

// Fetch the live game catalog. Currency is optional — when omitted the server
// uses its configured default (GAMBLEHUB_CURRENCY, e.g. TND). Merges the Gamblly
// live-casino games (separate provider) so the Live Casino tab shows them.
export async function fetchGames(currency?: string): Promise<CatalogGame[]> {
  const [casino, gambly] = await Promise.all([
    api
      .get<CatalogGame[]>("/casino/games", { params: currency ? { currency } : undefined })
      .then((r) => r.data)
      .catch(() => [] as CatalogGame[]),
    fetchGamblyLiveGames().catch(() => [] as CatalogGame[]),
  ]);
  return [...casino, ...gambly];
}

// Gamblly live-casino games (Evolution / Ezugi / Pragmatic Live). Tagged with
// account "gambly" so launch routes to /gambly/launch.
export async function fetchGamblyLiveGames(): Promise<CatalogGame[]> {
  const { data } = await api.get<
    Array<{ id: string; title: string; provider: string; imageUrl: string; isEnabled: boolean }>
  >("/gambly/games");
  return data.map((g) => ({
    id: g.id,
    title: g.title,
    provider: g.provider,
    imageUrl: g.imageUrl,
    isEnabled: g.isEnabled,
    account: "gambly" as const,
  }));
}

// Open a game session → returns the iframe url + session id.
// account "gambly" routes to the Gamblly V1 launcher; otherwise Gamble Hub.
export async function openGame(
  gameId: string,
  opts: { demo?: boolean; language?: string; account?: "slots" | "live" | "gambly" } = {},
): Promise<OpenGameResult> {
  if (opts.account === "gambly") {
    const { data } = await api.post<OpenGameResult>("/gambly/launch", {
      gameUid: gameId,
      language: opts.language,
    });
    return data;
  }
  const { data } = await api.post<OpenGameResult>("/casino/open", {
    gameId,
    demo: opts.demo,
    language: opts.language,
    account: opts.account,
  });
  return data;
}
// Withdraw balance after a V2 game session ends
export async function withdrawGambly(): Promise<{ success: boolean; amount: number }> {
  try {
    const { data } = await api.post("/gambly/withdraw");
    return data;
  } catch {
    return { success: false, amount: 0 };
  }
}
