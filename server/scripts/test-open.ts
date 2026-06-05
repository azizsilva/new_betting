// Standalone diagnostic: log in to Gamble Hub and try openGame for one game,
// printing the EXACT provider response. Isolates the provider from our app.
//
// Usage on the VPS:
//   cd /var/www/afrobet/server
//   npx tsx scripts/test-open.ts "nova:slot-pragmatic:vs20payanyvol" slots
//   npx tsx scripts/test-open.ts "<gameId>" live
//
import { config } from "dotenv";
config();
import crypto from "node:crypto";

const OFFICE = (process.env.GAMBLEHUB_OFFICE_URL || "https://office-api.gamble-hub.net").replace(/\/$/, "");
const CLIENT = (process.env.GAMBLEHUB_CLIENT_URL || "https://client-api.gamble-hub.net").replace(/\/$/, "");
const CURRENCY = (process.env.GAMBLEHUB_CURRENCY || "TND").toUpperCase();
const CALLBACK = process.env.GAMBLEHUB_CALLBACK_URL || "";

const gameId = process.argv[2];
const kind = (process.argv[3] || "slots") as "slots" | "live";
if (!gameId) {
  console.error('Usage: npx tsx scripts/test-open.ts "<gameId>" [slots|live]');
  process.exit(1);
}

const login = kind === "live" ? process.env.GAMBLEHUB_LIVE_LOGIN || process.env.GAMBLEHUB_LOGIN! : process.env.GAMBLEHUB_LOGIN!;
const password = kind === "live" ? process.env.GAMBLEHUB_LIVE_PASSWORD || process.env.GAMBLEHUB_PASSWORD! : process.env.GAMBLEHUB_PASSWORD!;
const secret = kind === "live" ? process.env.GAMBLEHUB_LIVE_SECRET || process.env.GAMBLEHUB_SECRET! : process.env.GAMBLEHUB_SECRET!;
const envUserId = kind === "live" ? process.env.GAMBLEHUB_LIVE_USER_ID || process.env.GAMBLEHUB_USER_ID : process.env.GAMBLEHUB_USER_ID;

function sign(body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function main() {
  console.log(`\n=== account=${kind} login=${login} currency=${CURRENCY} ===`);

  // 1) login
  const lr = await fetch(`${OFFICE}/auth/login`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ login, password }),
  });
  const ltext = await lr.text();
  if (!lr.ok) {
    console.error(`LOGIN FAILED ${lr.status}:`, ltext.slice(0, 400));
    process.exit(1);
  }
  const ldata = JSON.parse(ltext);
  const userId = envUserId || ldata.user?.id;
  console.log(`login ok -> user_id=${userId}`);

  // 2) confirm game is in the catalog for this currency
  const cat = await fetch(`${OFFICE}/users/${userId}/getUserGames/${CURRENCY}`, {
    headers: { accept: "application/json", authorization: `Bearer ${ldata.accessToken}` },
  });
  const games = (await cat.json()) as Array<{ id: string; title: string; isEnabled: boolean }>;
  const found = Array.isArray(games) ? games.find((g) => g.id === gameId) : undefined;
  console.log(`catalog size=${Array.isArray(games) ? games.length : "?"} | gameId in catalog: ${found ? `YES (${found.title}, enabled=${found.isEnabled})` : "NO"}`);

  // 3) openGame
  const payload: Record<string, string> = {
    currency: CURRENCY,
    demo: "0",
    exitUrl: "https://afrobet216.com",
    gameId,
    language: "en",
    player_login: "diagtest",
    user_id: String(userId),
  };
  if (CALLBACK) payload.callbackUrl = CALLBACK;
  const raw = JSON.stringify(payload);

  const or = await fetch(`${CLIENT}/games/openGame`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "x-signature": sign(raw) },
    body: raw,
  });
  const otext = await or.text();
  console.log(`\nopenGame HTTP ${or.status}`);
  console.log("payload:", raw);
  console.log("response:", otext.slice(0, 800));
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
