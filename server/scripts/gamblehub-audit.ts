// Audit which Gamble Hub providers actually LAUNCH (vs just appear in the
// catalog). For each provider it picks one enabled game and calls openGame,
// reporting OK / the exact error. This shows in ONE run which providers are
// enabled for your account and which return 400 "failed to open game".
//
//   cd /var/www/afrobet/server
//   npx tsx scripts/gamblehub-audit.ts            # slots account
//   npx tsx scripts/gamblehub-audit.ts live       # live account
//
import { config } from "dotenv";
config();
import crypto from "node:crypto";

const OFFICE = (process.env.GAMBLEHUB_OFFICE_URL || "https://office-api.gamble-hub.net").replace(/\/$/, "");
const CLIENT = (process.env.GAMBLEHUB_CLIENT_URL || "https://client-api.gamble-hub.net").replace(/\/$/, "");
const CURRENCY = (process.env.GAMBLEHUB_CURRENCY || "TND").toUpperCase();
const CALLBACK = process.env.GAMBLEHUB_CALLBACK_URL || "";

const kind = (process.argv[2] || "slots") as "slots" | "live";
const login = kind === "live" ? process.env.GAMBLEHUB_LIVE_LOGIN || process.env.GAMBLEHUB_LOGIN! : process.env.GAMBLEHUB_LOGIN!;
const password = kind === "live" ? process.env.GAMBLEHUB_LIVE_PASSWORD || process.env.GAMBLEHUB_PASSWORD! : process.env.GAMBLEHUB_PASSWORD!;
const secret = kind === "live" ? process.env.GAMBLEHUB_LIVE_SECRET || process.env.GAMBLEHUB_SECRET! : process.env.GAMBLEHUB_SECRET!;
const envUserId = kind === "live" ? process.env.GAMBLEHUB_LIVE_USER_ID || process.env.GAMBLEHUB_USER_ID : process.env.GAMBLEHUB_USER_ID;

interface Game {
  id: string;
  title: string;
  provider: string;
  isEnabled: boolean;
}

const sign = (body: string) => crypto.createHmac("sha256", secret).update(body).digest("hex");

async function openOne(userId: string, g: Game) {
  const payload: Record<string, string> = {
    currency: CURRENCY,
    demo: "0",
    exitUrl: "https://afrobet216.com",
    gameId: g.id,
    language: "en",
    player_login: "audittest",
    user_id: userId,
  };
  if (CALLBACK) payload.callbackUrl = CALLBACK;
  const raw = JSON.stringify(payload);
  const res = await fetch(`${CLIENT}/games/openGame`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "x-signature": sign(raw) },
    body: raw,
  });
  const text = await res.text();
  let data: { status?: string; error?: string; message?: string; code?: number } = {};
  try { data = JSON.parse(text); } catch { /* keep raw */ }
  const ok = res.ok && data.status === "success";
  return { ok, status: res.status, err: data.error || data.message || text.slice(0, 80) };
}

async function main() {
  const lr = await fetch(`${OFFICE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ login, password }),
  });
  if (!lr.ok) { console.error(`LOGIN FAILED ${lr.status}:`, (await lr.text()).slice(0, 300)); process.exit(1); }
  const ldata = await lr.json();
  const userId = String(envUserId || ldata.user?.id);
  console.log(`account=${kind} user_id=${userId} currency=${CURRENCY}\n`);

  const cat = await fetch(`${OFFICE}/users/${userId}/getUserGames/${CURRENCY}`, {
    headers: { accept: "application/json", authorization: `Bearer ${ldata.accessToken}` },
  });
  const games = (await cat.json()) as Game[];

  // One enabled game per provider.
  const perProvider = new Map<string, Game>();
  for (const g of games) {
    if (!g.isEnabled) continue;
    if (!perProvider.has(g.provider)) perProvider.set(g.provider, g);
  }

  console.log(`Testing launch for ${perProvider.size} providers (one game each)…\n`);
  const okList: string[] = [];
  const failList: string[] = [];

  for (const [provider, g] of perProvider) {
    const r = await openOne(userId, g);
    const line = `${r.ok ? "✅ OK  " : "❌ " + r.status} ${provider}  (${g.title})${r.ok ? "" : "  → " + r.err}`;
    console.log(line);
    (r.ok ? okList : failList).push(provider);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`WORKING (${okList.length}): ${okList.join(", ")}`);
  console.log(`\nFAILING (${failList.length}): ${failList.join(", ")}`);
  console.log(`\n→ Send the FAILING list to Gamble Hub: ask them to enable these providers for your account.`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
