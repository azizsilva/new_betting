// Placeholder casino data so the UI renders before the Gambly / iGamingAPIs
// feeds are wired in. Replace with live queries once providers are connected.

export interface CasinoTile {
  id: string;
  name: string;
  provider: string;
  tag?: "HOT" | "NEW" | "LIVE";
  hue: string; // gradient hue for the placeholder art
}

export const CASINO_GAMES: CasinoTile[] = [
  { id: "g1", name: "Munchy Milo", provider: "Hacksaw", tag: "HOT", hue: "from-fuchsia-500/30 to-violet-500/20" },
  { id: "g2", name: "Book of Dead", provider: "Play'n GO", hue: "from-amber-500/30 to-yellow-700/20" },
  { id: "g3", name: "Jelly Express", provider: "Pragmatic Play", tag: "NEW", hue: "from-pink-500/30 to-rose-500/20" },
  { id: "g4", name: "Power of Thor", provider: "Pragmatic Play", tag: "HOT", hue: "from-red-500/30 to-orange-600/20" },
  { id: "g5", name: "Big Bass Hold & Spin", provider: "Pragmatic Play", hue: "from-sky-500/30 to-blue-600/20" },
  { id: "g6", name: "Big Bass Keeping It", provider: "Pragmatic Play", hue: "from-cyan-500/30 to-teal-600/20" },
  { id: "g7", name: "Sweet Bonanza", provider: "Pragmatic Play", tag: "HOT", hue: "from-pink-400/30 to-fuchsia-500/20" },
  { id: "g8", name: "Gates of Olympus", provider: "Pragmatic Play", hue: "from-amber-400/30 to-yellow-600/20" },
];

export const LIVE_CASINO: CasinoTile[] = [
  { id: "lc1", name: "Crazy Time", provider: "Evolution", tag: "LIVE", hue: "from-violet-500/30 to-indigo-600/20" },
  { id: "lc2", name: "Monopoly Live", provider: "Evolution", tag: "LIVE", hue: "from-emerald-500/30 to-green-700/20" },
  { id: "lc3", name: "Baccarat", provider: "Evolution", tag: "LIVE", hue: "from-amber-500/30 to-orange-700/20" },
  { id: "lc4", name: "Blackjack", provider: "Evolution", tag: "LIVE", hue: "from-yellow-500/30 to-amber-700/20" },
  { id: "lc5", name: "Crazy Coin Flip", provider: "Evolution", tag: "LIVE", hue: "from-rose-500/30 to-red-700/20" },
  { id: "lc6", name: "Funky Time", provider: "Evolution", tag: "LIVE", hue: "from-fuchsia-500/30 to-pink-700/20" },
];
