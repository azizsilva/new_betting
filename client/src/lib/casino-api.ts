import { api } from "./api";
import type { CatalogGame } from "./games";

export interface OpenGameResult {
  url: string;
  sessionId: string;
}

// Fetch the live game catalog. Currency is optional — when omitted the server
// uses its configured default (GAMBLEHUB_CURRENCY, e.g. TND).
export async function fetchGames(currency?: string): Promise<CatalogGame[]> {
  const { data } = await api.get<CatalogGame[]>("/casino/games", {
    params: currency ? { currency } : undefined,
  });
  return data;
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
