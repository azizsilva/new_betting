// Build the Gamblly LIVE-casino catalog from the per-provider JSON exports in
// client/games-json/. Gamblly has no game-list API, but the operator exported
// every provider's games (shape: {gameid, gamename, providerName, image}).
// We pick only the LIVE providers and write server/src/data/gambly-games.json.
//
//   cd server && npx tsx scripts/gambly-import.ts
//
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(__dirname, "../../client/games-json");
const OUT = resolve(__dirname, "../src/data/gambly-games.json");

// Live-casino provider files to include (live dealer studios only — no slots).
const LIVE_FILES = [
  "Evolution_Live.json",
  "Evolution_Live_-_Asia.json",
  "Ezugi.json",
  "PragmaticPlay_Live_-_EU.json",
  "PragmaticPlay_Live_-_Asia.json",
  "DreamGaming.json",
  "SaGaming.json",
  "Sexy.json",
  "WM.json",
  "CreedRoomz.json",
  "YeeBet.json",
  "Microgaming_Live.json",
  "Winto_Live.json",
  "GAMINGSOFT-AI_LIVE_CASINO.json",
];

interface RawGame {
  gameid: string;
  gamename: string;
  providerName: string;
  image: string;
  category?: string;
}

interface OutGame {
  id: string; // gameid → game_uid passed to /v1/gameLaunch.php
  title: string;
  provider: string;
  imageUrl: string;
  isEnabled: boolean;
  account: "gambly";
  live: boolean;
}

function main() {
  const out: OutGame[] = [];
  const seen = new Set<string>();

  for (const file of LIVE_FILES) {
    const p = resolve(SRC_DIR, file);
    if (!existsSync(p)) {
      console.warn(`skip (missing): ${file}`);
      continue;
    }
    let arr: RawGame[] = [];
    try {
      arr = JSON.parse(readFileSync(p, "utf8")) as RawGame[];
    } catch {
      console.warn(`skip (bad json): ${file}`);
      continue;
    }
    let added = 0;
    for (const g of arr) {
      if (!g.gameid || seen.has(g.gameid)) continue;
      seen.add(g.gameid);
      out.push({
        id: g.gameid,
        title: g.gamename || g.gameid,
        provider: g.providerName || "Live Casino",
        imageUrl: g.image || "",
        isEnabled: true,
        account: "gambly",
        live: true,
      });
      added++;
    }
    console.log(`${file}: +${added}`);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length} live games → ${OUT}`);
}

main();
