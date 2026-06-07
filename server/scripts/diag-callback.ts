// Diagnostic: shows last 5 GameSessions in DB, then simulates a getBalance
// callback to our own server to see if HMAC passes and session resolves.
//
// Usage on VPS:
//   cd /var/www/afrobet/server
//   npx tsx scripts/diag-callback.ts
//
import { config } from "dotenv";
config();
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SECRET = process.env.GAMBLEHUB_SECRET || "";
const CALLBACK = process.env.GAMBLEHUB_CALLBACK_URL || "http://localhost:4000/api/casino/callback";
const LOCAL_CALLBACK = "http://localhost:4000/api/casino/callback";

function sign(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function main() {
  // 1) Show last 5 sessions
  console.log("\n=== Last 5 GameSessions in DB ===");
  const sessions = await prisma.gameSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { username: true, balance: true } } },
  });

  if (sessions.length === 0) {
    console.log("NO sessions found — openGame is not creating sessions!");
    console.log("This means openGame is failing before the DB write.");
  } else {
    for (const s of sessions) {
      console.log({
        sessionId: s.sessionId.slice(0, 30) + "...",
        login: s.login,
        userId: s.userId,
        username: s.user?.username,
        balance: s.user?.balance?.toString(),
        currency: s.currency,
        gameId: s.gameId,
        createdAt: s.createdAt.toISOString(),
      });
    }
  }

  if (sessions.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const latest = sessions[0];

  // 2) Simulate getBalance callback WITH signature
  console.log("\n=== Simulating getBalance callback (with signature) ===");
  const bodyWithSig = JSON.stringify({
    cmd: "getBalance",
    login: latest.login,
    sessionid: latest.sessionId,
  });
  const sig = sign(bodyWithSig, SECRET);
  console.log("Sending to:", LOCAL_CALLBACK);
  console.log("Body:", bodyWithSig);
  console.log("Signature:", sig.slice(0, 20) + "...");

  try {
    const r1 = await fetch(LOCAL_CALLBACK, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signature": sig,
      },
      body: bodyWithSig,
    });
    const t1 = await r1.text();
    console.log("Response HTTP", r1.status, ":", t1);
  } catch (e) {
    console.error("Fetch error:", (e as Error).message);
  }

  // 3) Simulate getBalance WITHOUT signature (to see if that's the issue)
  console.log("\n=== Simulating getBalance callback (WITHOUT signature) ===");
  const bodyNoSig = JSON.stringify({
    cmd: "getBalance",
    login: latest.login,
    sessionid: latest.sessionId,
  });
  try {
    const r2 = await fetch(LOCAL_CALLBACK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: bodyNoSig,
    });
    const t2 = await r2.text();
    console.log("Response HTTP", r2.status, ":", t2);
  } catch (e) {
    console.error("Fetch error:", (e as Error).message);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
