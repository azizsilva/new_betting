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
  account?: "slots" | "live" | "gambly"; // operator account that owns/launches this game
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
  { id: "5-lions-megaways", name: "5 Lions Megaways", provider: "Pragmatic Play", tab: "casino", tags: ["megaways"], imageUrl: "/images/PPC-5lionsmegaways.jpeg" },
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
  { id: "candy-bonanza-2", name: "Candy Bonanza 2", provider: "Pragmatic Play", tab: "casino", tags: [] },
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
  account?: "slots" | "live" | "gambly"; // which operator account this game belongs to
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
  "5lionsmegaways": "/images/PPC-5lionsmegaways.jpeg",
  "5lions": "/images/PPC-5lionsmegaways.jpeg",
  jellyexpress: "/images/PPC-jellyexpress.png",
  powerofthormegaways: "/images/PPC-powerofthormegaways.png",
  powerofthor: "/images/PPC-powerofthormegaways.png",
  bigbassholdspinnermegaways: "/images/PPC-bigbassholdspinnermegaways.png",
  bigbassholdspin: "/images/PPC-bigbassholdspinnermegaways.png",
  bigbasskeepingitreel: "/images/PPC-bigbasskeepingitreel.png",
  bigbasskeepingit: "/images/PPC-bigbasskeepingitreel.png",
  aztecgemsmegaways: "/images/PPC-aztecgemsmegaways.png",
  aztecgems: "/images/PPC-aztecgemsmegaways.png",
  madamedestinymegaways: "/images/PPC-madamedestinymegaways.png",
  madamedestiny: "/images/PPC-madamedestinymegaways.png",
  sweetbonanza1000: "/images/PPC-sweetbonanza1000.png",
  sweetbonanza: "/images/PPC-sweetbonanza1000.png",
  // Live casino (Evolution)
  baccarat: "/images/EVO-baccarat.png",
  blackjack: "/images/EVO-blackjack.png",
  crazycoinflip: "/images/EVO-crazycoinflip.png",
  crazytime: "/images/crazy_time.jpeg",
  funkytime: "/images/EVO-funkytime.png",
  monopoly: "/images/monopoly.jpeg",
  monopolylive: "/images/monopoly.jpeg",
  lightningstorm: "/images/EVO-lightningstorm.png",
  parthenonquestforimmortality: "/images/NE-parthenonquestforimmortality.png",
};

// Resolve a catalog game → local image path. Exact slug match only — a loose
// "includes" match wrongly mapped every "Madame Destiny *" variant to one image.
function localImage(g: CatalogGame): string | undefined {
  return LOCAL_IMAGES[slug(g.title)];
}

// GambleHub returns raw internal provider slugs (slot-croco, sg, sgx, etc.).
// Map them to proper display names for the UI filter + card labels.
const PROVIDER_DISPLAY: Record<string, string> = {
  // Pragmatic Play variants
  "pragmaticplay":          "Pragmatic Play",
  "pragmatic-play":         "Pragmatic Play",
  "pragmatic_play":         "Pragmatic Play",
  "pragmatic":              "Pragmatic Play",
  "slot-pragmatic":         "Pragmatic Play",
  "slot-pp":                "Pragmatic Play",
  "pp":                     "Pragmatic Play",

  // Evolution
  "evolution":              "Evolution",
  "evolution-gaming":       "Evolution",
  "evolutiongaming":        "Evolution",
  "live-evolution":         "Evolution",

  // Hacksaw Gaming
  "hacksaw":                "Hacksaw Gaming",
  "hacksaw-gaming":         "Hacksaw Gaming",
  "slot-hacksaw":           "Hacksaw Gaming",

  // Nolimit City
  "nolimitcity":            "Nolimit City",
  "nolimit-city":           "Nolimit City",
  "nolimit":                "Nolimit City",
  "slot-nolimit":           "Nolimit City",

  // Play'n GO
  "playngo":                "Play'n GO",
  "play-n-go":              "Play'n GO",
  "playingo":               "Play'n GO",

  // NetEnt / Red Tiger
  "netent":                 "NetEnt",
  "net-ent":                "NetEnt",
  "redtiger":               "Red Tiger",
  "red-tiger":              "Red Tiger",

  // Spribe
  "spribe":                 "Spribe",

  // Ezugi
  "ezugi":                  "Ezugi",

  // Relax Gaming
  "relaxgaming":            "Relax Gaming",
  "relax-gaming":           "Relax Gaming",
  "relax":                  "Relax Gaming",

  // Push Gaming
  "pushgaming":             "Push Gaming",
  "push-gaming":            "Push Gaming",
  "push":                   "Push Gaming",

  // Big Time Gaming
  "bigtimegaming":          "Big Time Gaming",
  "btg":                    "Big Time Gaming",

  // Thunderkick
  "thunderkick":            "Thunderkick",

  // Yggdrasil
  "yggdrasil":              "Yggdrasil",

  // Quickspin
  "quickspin":              "Quickspin",

  // Microgaming
  "microgaming":            "Microgaming",

  // iSoftBet
  "isoftbet":               "iSoftBet",

  // Endorphina
  "endorphina":             "Endorphina",

  // Amatic
  "amatic":                 "Amatic",

  // Habanero
  "habanero":               "Habanero",
  "slot-habanero":          "Habanero",

  // GameArt
  "gameart":                "GameArt",

  // Iron Dog Studio
  "irondogstudio":          "Iron Dog Studio",
  "irondog":                "Iron Dog Studio",

  // ReelPlay
  "reelplay":               "ReelPlay",

  // PG Soft
  "pgsoft":                 "PG Soft",
  "pg-soft":                "PG Soft",
  "pg":                     "PG Soft",

  // Wazdan
  "wazdan":                 "Wazdan",

  // Tom Horn
  "tomhorn":                "Tom Horn",
  "tom-horn":               "Tom Horn",

  // Spinomenal
  "spinomenal":             "Spinomenal",

  // Kalamba
  "kalamba":                "Kalamba Games",
  "kalambagames":           "Kalamba Games",

  // Betsoft
  "betsoft":                "Betsoft",

  // 1x2 Gaming / Iron Dog
  "1x2gaming":              "1x2 Gaming",

  // Booming Games
  "booominggames":          "Booming Games",
  "boominggames":           "Booming Games",
  "booming":                "Booming Games",

  // GreenTube / Novomatic
  "greentube":              "Greentube",
  "novomatic":              "Novomatic",

  // Skywind
  "skywind":                "Skywind",

  // Slot Mill
  "slotmill":               "Slot Mill",
  "slot-mill":              "Slot Mill",

  // Mascot Gaming
  "mascot":                 "Mascot Gaming",
  "mascotgaming":           "Mascot Gaming",

  // Slot-croco, sg, sgx, vegas — GambleHub internal labels
  "slot-croco":             "Swintt",
  "slotcroco":              "Swintt",
  "sg":                     "Scientific Games",
  "sgx":                    "Scientific Games",
  "vegas":                  "Vegas Slots",
  "swintt":                 "Swintt",

  // Tada
  "tada":                   "TaDa Gaming",
  "tada-gaming":            "TaDa Gaming",
};

function normalizeProvider(raw: string): string {
  if (!raw) return "Unknown";
  const key = raw.toLowerCase().trim();
  return PROVIDER_DISPLAY[key] ?? raw; // fall back to raw if not in map
}

// Bucket a provider catalog entry into one of the lobby tabs.
function tabFor(g: CatalogGame): GameTab {
  const p = normalizeProvider(g.provider);
  if (LIVE_PROVIDERS.test(p) || /live|roulette|baccarat|blackjack/i.test(g.title))
    return "live-casino";
  if (INSTANT_PROVIDERS.test(p)) return "instant";
  return "casino";
}

// Derive quick-filter tags from the game title/provider so the New/Megaways/
// Bonus Buy/Crash filters actually match something.
const CRASH_NAMES = /(aviator|balloon|\bdice\b|\bgoal\b|\bhilo\b|\bmines\b|plinko|crash|spaceman|jetx|rocket)/i;
function tagsFor(g: CatalogGame): GameTag[] {
  const t: GameTag[] = [];
  if (/megaways/i.test(g.title)) t.push("megaways");
  if (/(bonus buy|buy bonus|buy feature|achat bonus)/i.test(g.title)) t.push("bonus-buy");
  if (CRASH_NAMES.test(g.title) || /spribe/i.test(g.provider)) t.push("crash");
  return t;
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
    const tags = tagsFor(g);
    // First 40 catalog entries flagged "new" (the catalog is roughly newest-first).
    if (i < 40) tags.push("new");
    const provider = normalizeProvider(g.provider);
    out.push({
      id: g.id,
      gameId: g.id,
      name: g.title,
      provider,
      tab: g.account === "live" || g.account === "gambly" ? "live-casino" : tabFor(g),
      account: g.account,
      tags,
      // Every 9th game becomes a large featured card (same rhythm as kingsbet365).
      featured: i % 9 === 0,
      hue: hue(i),
      // Prefer our local downloaded art, then the provider's own image.
      imageUrl: localImage(g) || g.imageUrl || undefined,
    });
    i++;
  }
  return pinCurated(out);
}

// Pin a hand-picked set to the front of the casino grid (kingsbet365 order), the
// first as a large featured tile. Only games present in the catalog are pinned.
const CASINO_PINNED = [
  "5lionsmegaways",
  "jellyexpress",
  "bigbassholdspinnermegaways",
  "bigbasskeepingitreel",
  "sweetbonanza",
  "madamedestiny",
  "gatesofolympus",
  "sugarrush",
  "wolfgold",
  "aztecgems",
];
function pinCurated(all: Game[]): Game[] {
  const pinned: Game[] = [];
  const rest: Game[] = [];
  const used = new Set<string>();
  for (const want of CASINO_PINNED) {
    const g = all.find((x) => slug(x.name) === want && !used.has(x.id));
    if (g) {
      used.add(g.id);
      pinned.push(g);
    }
  }
  for (const g of all) if (!used.has(g.id)) rest.push(g);
  // Re-flag featured: only the very first pinned card is the big 2×2 tile.
  return [...pinned, ...rest].map((g, i) => ({ ...g, featured: i === 0 }));
}

// ─── Curated homepage rows ────────────────────────────────────────────────────
// The homepage shows a FIXED, hand-picked set per row (kingsbet365 style) built
// from the local art we actually have in /public/images. These cards ALWAYS
// render (exactly like kingsbet365) — they never disappear because of a catalog
// miss. When the live catalog has a matching game we attach its REAL gameId so a
// logged-in player launches it; otherwise the card still shows and a guest tap
// surfaces the login modal (card-level gate in CasinoGameCard).
//
// Each entry: slug (matches a LOCAL_IMAGES key + used to find the catalog game),
// the display name, and the provider label shown under the title.
interface CuratedPick {
  slug: string;
  name: string;
  provider: string;
  match?: string[]; // candidate catalog name slugs to find the real game id
}

const HOME_CASINO: CuratedPick[] = [
  { slug: "gatesofolympus",            name: "Gates of Olympus",           provider: "Pragmatic Play" },
  { slug: "allwaysfruits",             name: "All Ways Fruits",            provider: "Amatic" },
  { slug: "hothotfruit",               name: "Hot Hot Fruit",              provider: "Habanero" },
  { slug: "wanteddeadorawild",         name: "Wanted Dead or a Wild",      provider: "Hacksaw" },
  { slug: "bigbassholdspinnermegaways", name: "Big Bass Hold & Spinner",   provider: "Pragmatic Play" },
  { slug: "billyonair",                name: "Billy on Air",               provider: "Pragmatic Play" },
];

// Live games — local Evolution art, launched via Gamblly. `match` lists the
// Gamblly catalog name(s) to find the real game_uid. Crazy Time A / Funky Time /
// Monopoly Live etc. are Evolution Live Row games in the Gamblly export.
const HOME_LIVE: CuratedPick[] = [
  { slug: "crazytime", name: "Crazy Time", provider: "Evolution", match: ["crazytimea", "crazytime"] },
  { slug: "monopoly", name: "Monopoly Live", provider: "Evolution", match: ["monopolylive", "monopoly"] },
  { slug: "funkytime", name: "Funky Time", provider: "Evolution", match: ["funkytime"] },
  { slug: "crazycoinflip", name: "Crazy Coin Flip", provider: "Evolution", match: ["crazycoinflip"] },
  { slug: "lightningstorm", name: "Lightning Storm", provider: "Evolution", match: ["lightningstorm"] },
  { slug: "baccarat", name: "Baccarat", provider: "Evolution", match: ["baccarat", "speedbaccarat"] },
  { slug: "blackjack", name: "Blackjack", provider: "Evolution", match: ["blackjack", "lightningblackjack"] },
];

// Build a curated row from the picks: always render a card with the local image.
// PREFER a Gamblly (account="gambly") match so the card launches via Gamblly;
// fall back to any catalog match, then to the slug. match[] lists candidate
// catalog name slugs to find the real game_uid.
function curatedRow(all: Game[], picks: CuratedPick[], defaultAccount?: "slots" | "live"): Game[] {
  return picks.map((pick, i) => {
    const wants = pick.match ?? [pick.slug];
    const find = (pred: (g: Game) => boolean) =>
      all.find((g) => pred(g) && (g.account === "gambly")) ?? all.find(pred);
    const match =
      find((g) => wants.includes(slug(g.name))) ??
      find((g) => wants.some((w) => slug(g.name).startsWith(w)));
    return {
      id: match?.id ?? pick.slug,
      gameId: match?.gameId ?? match?.id, // undefined → launch shows login/toast
      name: pick.name,
      provider: pick.provider,
      tab: defaultAccount === "live" ? "live-casino" : "casino",
      account: match?.account ?? defaultAccount,
      tags: match?.tags ?? [],
      featured: false,
      hue: hue(i),
      imageUrl: LOCAL_IMAGES[pick.slug] ?? match?.imageUrl,
    } satisfies Game;
  });
}

export function homeCasinoRow(all: Game[]): Game[] {
  return curatedRow(all, HOME_CASINO);
}
export function homeLiveRow(all: Game[]): Game[] {
  return curatedRow(all, HOME_LIVE, "live");
}
