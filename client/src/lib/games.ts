// Static casino game catalogue used until the Gambly / iGamingAPIs feeds are
// wired in. The shape mirrors what the provider list endpoints will return,
// so the UI won't change when we swap in live data.

export type GameTab = "casino" | "live-casino" | "instant";
export type GameTag = "new" | "megaways" | "bonus-buy" | "crash";

export interface Game {
  id: string;
  name: string;
  provider: string;
  tab: GameTab;
  tags: GameTag[];
  featured?: boolean; // renders as a larger 2x2 tile
  hue: string; // gradient placeholder / fallback when no thumbnail
  imageUrl?: string; // real thumbnail from the provider catalog
  gameId?: string; // provider game id passed to openGame (falls back to id)
}

// gradient helpers for the placeholder art
const HUES = [
  "from-fuchsia-500/40 to-violet-700/30",
  "from-amber-500/40 to-yellow-800/30",
  "from-pink-500/40 to-rose-700/30",
  "from-red-500/40 to-orange-800/30",
  "from-sky-500/40 to-blue-800/30",
  "from-cyan-500/40 to-teal-800/30",
  "from-emerald-500/40 to-green-800/30",
  "from-indigo-500/40 to-purple-800/30",
];
const hue = (i: number) => HUES[i % HUES.length]!;

const RAW: Array<Omit<Game, "hue">> = [
  { id: "munchy-milo", name: "Munchy Milo", provider: "Hacksaw", tab: "casino", tags: ["new"], featured: true },
  { id: "book-of-dead", name: "Book of Dead", provider: "Play'n GO", tab: "casino", tags: [] },
  { id: "jelly-express", name: "Jelly Express", provider: "Pragmatic Play", tab: "casino", tags: ["new"] },
  { id: "power-of-thor", name: "Power of Thor", provider: "Pragmatic Play", tab: "casino", tags: ["megaways"] },
  { id: "big-bass-hold", name: "Big Bass Hold & Spin", provider: "Pragmatic Play", tab: "casino", tags: ["bonus-buy"] },
  { id: "big-bass-keeping", name: "Big Bass Keeping It", provider: "Pragmatic Play", tab: "casino", tags: [] },
  { id: "sweet-bonanza", name: "Sweet Bonanza", provider: "Pragmatic Play", tab: "casino", tags: ["bonus-buy"] },
  { id: "madame-destiny", name: "Madame Destiny", provider: "Pragmatic Play", tab: "casino", tags: ["megaways"] },
  { id: "aztec-gems", name: "Aztec Gems Megaways", provider: "Pragmatic Play", tab: "casino", tags: ["megaways"] },
  { id: "queens-banquet", name: "The Queen's Banquet", provider: "PG Soft", tab: "casino", tags: ["new"] },
  { id: "duck-hunters", name: "Duck Hunters", provider: "Nolimit City", tab: "casino", tags: ["bonus-buy"] },
  { id: "ludo", name: "Ludo", provider: "TaDa", tab: "casino", tags: [] },
  { id: "ludo-quick", name: "Ludo Quick", provider: "TaDa", tab: "casino", tags: ["new"] },
  { id: "money-train-3", name: "Money Train 3", provider: "Relax Gaming", tab: "casino", tags: ["bonus-buy"] },
  { id: "kings-of-glory", name: "Kings of Glory", provider: "Oddin.gg", tab: "casino", tags: [] },
  { id: "wanted-dead", name: "Wanted Dead or a Wild", provider: "Hacksaw", tab: "casino", tags: ["bonus-buy"], featured: true },
  { id: "amazon-riches", name: "Amazon Riches", provider: "Endorphina", tab: "casino", tags: [], featured: true },
  { id: "chilli-heat", name: "Chilli Heat", provider: "Pragmatic Play", tab: "casino", tags: [], featured: true },
  { id: "5-lions", name: "5 Lions Megaways", provider: "Pragmatic Play", tab: "casino", tags: ["megaways"] },
  { id: "1m-fortunes", name: "1 Million Fortunes Megaways", provider: "Iron Dog Studio", tab: "casino", tags: ["megaways"] },
  { id: "20-hot-fruits", name: "20 Hot Super Fruits", provider: "GameArt", tab: "casino", tags: [] },
  { id: "3-christmas", name: "3 Christmas Fortunes", provider: "Iron Dog Studio", tab: "casino", tags: [] },
  { id: "gates-olympus", name: "Gates of Olympus", provider: "Pragmatic Play", tab: "casino", tags: [] },
  { id: "great-rhino", name: "Great Rhino Megaways", provider: "Pragmatic Play", tab: "casino", tags: ["megaways"] },
  { id: "sugar-rush", name: "Sugar Rush", provider: "Pragmatic Play", tab: "casino", tags: ["bonus-buy"] },
  { id: "10k-wolves", name: "10,000 Wolves 10K Ways", provider: "ReelPlay", tab: "casino", tags: ["megaways"] },
  { id: "10k-wonders", name: "10,000 Wonders", provider: "ReelPlay", tab: "casino", tags: [] },
  { id: "10001-nights", name: "10 001 Nights", provider: "Red Tiger", tab: "casino", tags: ["megaways"] },
  { id: "candy-bonanza", name: "Candy Bonanza", provider: "Pragmatic Play", tab: "casino", tags: [] },

  // Live casino
  { id: "crazy-time", name: "Crazy Time", provider: "Evolution", tab: "live-casino", tags: [], featured: true },
  { id: "monopoly-live", name: "Monopoly Live", provider: "Evolution", tab: "live-casino", tags: [] },
  { id: "baccarat", name: "Baccarat", provider: "Evolution", tab: "live-casino", tags: [] },
  { id: "blackjack", name: "Blackjack", provider: "Evolution", tab: "live-casino", tags: [] },
  { id: "crazy-coin-flip", name: "Crazy Coin Flip", provider: "Evolution", tab: "live-casino", tags: [] },
  { id: "funky-time", name: "Funky Time", provider: "Evolution", tab: "live-casino", tags: ["new"] },
  { id: "lightning-roulette", name: "Lightning Roulette", provider: "Evolution", tab: "live-casino", tags: [] },
  { id: "mega-wheel", name: "Mega Wheel", provider: "Pragmatic Play", tab: "live-casino", tags: [] },

  // Instant / crash
  { id: "aviator", name: "Aviator", provider: "Spribe", tab: "instant", tags: ["crash"], featured: true },
  { id: "mines", name: "Mines", provider: "Spribe", tab: "instant", tags: ["new"] },
  { id: "plinko", name: "Plinko", provider: "Spribe", tab: "instant", tags: ["crash"] },
  { id: "dice", name: "Dice", provider: "Spribe", tab: "instant", tags: [] },
  { id: "goal", name: "Goal", provider: "Spribe", tab: "instant", tags: [] },
  { id: "hilo", name: "Hilo", provider: "Spribe", tab: "instant", tags: ["crash"] },
  { id: "keno", name: "Keno", provider: "Spribe", tab: "instant", tags: [] },
];

export const GAMES: Game[] = RAW.map((g, i) => ({ ...g, hue: hue(i) }));

export const PROVIDERS = Array.from(new Set(GAMES.map((g) => g.provider))).sort();

export const TOTAL_GAMES = 10100; // matches the "X sur 10100 chargés" copy

export const QUICK_FILTERS: { id: GameTag | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "megaways", label: "Megaways" },
  { id: "bonus-buy", label: "Bonus Buy" },
  { id: "crash", label: "Crash Games" },
];

// ─── Live catalog mapping (Gamble Hub) ────────────────────────────────────────

// Raw shape returned by GET /casino/games.
export interface CatalogGame {
  id: string;
  title: string;
  imageUrl: string;
  provider: string;
  isEnabled?: boolean;
}

const LIVE_PROVIDERS = /(evolution|ezugi|pragmatic.?play.?live|live)/i;
const INSTANT_PROVIDERS = /(spribe|aviator|turbo|smartsoft|crash)/i;

function slug(s: string): string {
  return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "");
}

// Local game art lives in /public/images as <PREFIX>-<slug>.png. We match a
// catalog game to a file by its title slug (provider prefix is just how the file
// is named). Add files here as you download more art.
const LOCAL_IMAGES: Record<string, string> = {
  munchymilo: "/images/HAK-munchymilo.png",
  bookofdeadgocollect: "/images/PNG-bookofdeadgocollect.png",
  bookofdead: "/images/PNG-bookofdeadgocollect.png",
  jellyexpress: "/images/PPC-jellyexpress.png",
  powerofthormegaways: "/images/PPC-powerofthormegaways.png",
  powerofthor: "/images/PPC-powerofthormegaways.png",
  bigbassholdspinnermegaways: "/images/PPC-bigbassholdspinnermegaways.png",
  bigbassholdspin: "/images/PPC-bigbassholdspinnermegaways.png",
  bigbasskeepingitreel: "/images/PPC-bigbasskeepingitreel.png",
  bigbasskeepingit: "/images/PPC-bigbasskeepingitreel.png",
  // Live casino (Evolution)
  baccarat: "/images/EVO-baccarat.png",
  blackjack: "/images/EVO-blackjack.png",
  crazycoinflip: "/images/EVO-crazycoinflip.png",
  crazytime: "/images/EVO-crazytime.png",
  funkytime: "/images/EVO-funkytime.png",
  monopoly: "/images/EVO-monopoly.png",
  monopolylive: "/images/EVO-monopoly.png",
};

// Resolve a catalog game → local image path. Exact slug match only — a loose
// "includes" match wrongly mapped every "Madame Destiny *" variant to one image.
function localImage(g: CatalogGame): string | undefined {
  return LOCAL_IMAGES[slug(g.title)];
}

// Bucket a provider catalog entry into one of the lobby tabs.
function tabFor(g: CatalogGame): GameTab {
  if (LIVE_PROVIDERS.test(g.provider) || /live|roulette|baccarat|blackjack/i.test(g.title))
    return "live-casino";
  if (INSTANT_PROVIDERS.test(g.provider)) return "instant";
  return "casino";
}

// Convert the provider catalog into the UI's Game shape, dropping duplicates.
// The catalog can repeat the same game (same id, or same title+provider); we keep
// the first occurrence so the lobby doesn't show 4× "Madame Destiny".
export function mapCatalog(games: CatalogGame[]): Game[] {
  const seen = new Set<string>();
  const out: Game[] = [];
  let i = 0;
  for (const g of games) {
    const dedupeKey = g.id || `${slug(g.provider)}:${slug(g.title)}`;
    const titleKey = `${slug(g.provider)}:${slug(g.title)}`;
    if (seen.has(dedupeKey) || seen.has(titleKey)) continue;
    seen.add(dedupeKey);
    seen.add(titleKey);
    out.push({
      id: g.id,
      gameId: g.id,
      name: g.title,
      provider: g.provider || "Unknown",
      tab: tabFor(g),
      tags: [],
      // Every 9th game becomes a large featured card (same rhythm as kingsbet365).
      featured: i % 9 === 0,
      hue: hue(i),
      // Prefer our local downloaded art, then the provider's own image.
      imageUrl: localImage(g) || g.imageUrl || undefined,
    });
    i++;
  }
  return out;
}
