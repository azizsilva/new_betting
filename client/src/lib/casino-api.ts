import { api } from "./api";
import type { CatalogGame } from "./games";

export interface OpenGameResult {
  url: string;
  sessionId: string;
}

// Fetch the live game catalog for a currency (auth required).
export async function fetchGames(currency = "USD"): Promise<CatalogGame[]> {
  const { data } = await api.get<CatalogGame[]>("/casino/games", { params: { currency } });
  return data;
}

// Open a game session → returns the iframe url + session id.
export async function openGame(
  gameId: string,
  opts: { demo?: boolean; language?: string } = {},
): Promise<OpenGameResult> {
  const { data } = await api.post<OpenGameResult>("/casino/open", { gameId, ...opts });
  return data;
}
