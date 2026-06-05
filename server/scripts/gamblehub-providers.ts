// List the Gamble Hub catalog grouped by provider, for both the slots and live
// accounts. Reveals whether Amatic (or any provider) is actually in the TND
// catalog. Run on the VPS (IP-whitelisted):
//
//   cd /var/www/afrobet/server
//   npx tsx scripts/gamblehub-providers.ts          # slots account
//   npx tsx scripts/gamblehub-providers.ts live      # live account
//   npx tsx scripts/gamblehub-providers.ts slots amatic   # filter to a provider
//
import { config } from "dotenv";
config();

const OFFICE = (process.env.GAMBLEHUB_OFFICE_URL || "https://office-api.gamble-hub.net").replace(/\/$/, "");
const CURRENCY = (process.env.GAMBLEHUB_CURRENCY || "TND").toUpperCase();

const kind = (process.argv[2] || "slots") as "slots" | "live";
const filter = (process.argv[3] || "").toLowerCase();

const login =
  kind === "live"
    ? process.env.GAMBLEHUB_LIVE_LOGIN || process.env.GAMBLEHUB_LOGIN!
    : process.env.GAMBLEHUB_LOGIN!;
const password =
  kind === "live"
    ? process.env.GAMBLEHUB_LIVE_PASSWORD || process.env.GAMBLEHUB_PASSWORD!
    : process.env.GAMBLEHUB_PASSWORD!;
const envUserId =
  kind === "live"
    ? process.env.GAMBLEHUB_LIVE_USER_ID || process.env.GAMBLEHUB_USER_ID
    : process.env.GAMBLEHUB_USER_ID;

interface Game {
  id: string;
  title: string;
  provider: string;
  isEnabled: boolean;
}

async function main() {
  const lr = await fetch(`${OFFICE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ login, password }),
  });
  if (!lr.ok) {
    console.error(`LOGIN FAILED ${lr.status}:`, (await lr.text()).slice(0, 300));
    process.exit(1);
  }
  const ldata = await lr.json();
  const userId = envUserId || ldata.user?.id;
  console.log(`account=${kind} login=${login} user_id=${userId} currency=${CURRENCY}\n`);

  const cat = await fetch(`${OFFICE}/users/${userId}/getUserGames/${CURRENCY}`, {
    headers: { accept: "application/json", authorization: `Bearer ${ldata.accessToken}` },
  });
  const games = (await cat.json()) as Game[];
  if (!Array.isArray(games)) {
    console.error("catalog response not an array:", JSON.stringify(games).slice(0, 300));
    process.exit(1);
  }

  // Group by provider.
  const byProvider = new Map<string, { total: number; enabled: number; sample: string[] }>();
  for (const g of games) {
    const p = g.provider || "(unknown)";
    const e = byProvider.get(p) ?? { total: 0, enabled: 0, sample: [] };
    e.total++;
    if (g.isEnabled) e.enabled++;
    if (e.sample.length < 3) e.sample.push(`${g.title} [${g.id}]`);
    byProvider.set(p, e);
  }

  const rows = [...byProvider.entries()].sort((a, b) => b[1].total - a[1].total);
  console.log(`TOTAL games: ${games.length} | providers: ${rows.length}\n`);

  const filtered = filter
    ? rows.filter(([p]) => p.toLowerCase().includes(filter))
    : rows;

  if (filter && filtered.length === 0) {
    console.log(`No provider matches "${filter}". All providers:`);
    rows.forEach(([p, e]) => console.log(`  ${p}  (${e.enabled}/${e.total})`));
    return;
  }

  for (const [p, e] of filtered) {
    console.log(`${p}  —  ${e.enabled} enabled / ${e.total} total`);
    if (filter) e.sample.forEach((s) => console.log(`     ${s}`));
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
