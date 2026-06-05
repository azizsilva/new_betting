// Probe the Gamblly API: discover whether a game-list endpoint exists, and
// test a V1 launch. The public docs list no catalog endpoint, so we try the
// common ones. Run on the VPS (IP/domain whitelisted there).
//
//   cd /var/www/afrobet/server
//   npx tsx scripts/gambly-probe.ts                  # discover game-list endpoints
//   npx tsx scripts/gambly-probe.ts "<game_uid>"     # also test a V1 launch
//
import { config } from "dotenv";
config();

const BASE = (process.env.GAMBLY_API_BASE_URL || "https://game.gambllyapi.com/production/").replace(/\/$/, "");
const KEY = process.env.GAMBLY_API_KEY || "";
const CURRENCY = (process.env.GAMBLY_CURRENCY || "TND").toUpperCase();

if (!KEY) {
  console.error("GAMBLY_API_KEY is not set in .env");
  process.exit(1);
}

// Candidate catalog endpoints to try (path -> body). The docs don't define one,
// so we probe the conventional names with both v1 and v2 shapes.
const CANDIDATES: Array<{ path: string; json: Record<string, unknown> }> = [
  { path: "/v1/gameList.php", json: { api_key: KEY } },
  { path: "/v1/getGameList.php", json: { api_key: KEY } },
  { path: "/v1/games.php", json: { api_key: KEY } },
  { path: "/v2/gameList.php", json: { agency_uid: KEY } },
  { path: "/v2/getGameList.php", json: { agency_uid: KEY } },
  { path: "/v2/games.php", json: { agency_uid: KEY } },
  { path: "/gameList.php", json: { agency_uid: KEY } },
];

async function tryEndpoint(path: string, json: Record<string, unknown>) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
    const text = await res.text();
    const isHtml = /^\s*</.test(text);
    console.log(`\n${path}  ->  HTTP ${res.status}`);
    console.log(isHtml ? "(HTML — likely 404 page)" : text.slice(0, 500));
    return { ok: res.ok && !isHtml, text };
  } catch (e) {
    console.log(`\n${path}  ->  ERROR ${(e as Error).message}`);
    return { ok: false, text: "" };
  }
}

async function main() {
  console.log(`BASE=${BASE}  CURRENCY=${CURRENCY}`);
  console.log("=== Probing for a game-list endpoint ===");
  for (const c of CANDIDATES) await tryEndpoint(c.path, c.json);

  const gameUid = process.argv[2];
  if (gameUid) {
    console.log(`\n=== V1 launch test for game_uid=${gameUid} ===`);
    const form = new URLSearchParams({
      api_key: KEY,
      member_account: "diagtest",
      game_uid: gameUid,
      currency_code: CURRENCY,
      language: "en",
      platform: "1",
      home_url: "https://afrobet216.com",
    });
    const res = await fetch(`${BASE}/v1/gameLaunch.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const text = await res.text();
    console.log(`/v1/gameLaunch.php -> HTTP ${res.status}`);
    console.log(text.slice(0, 600));
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
