import { PrismaClient, type UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const hash = (p: string) => argon2.hash(p, { type: argon2.argon2id });

// Create (or reuse) a user under a parent, mirroring the xbet workflow:
// the parent extends credit downward; the child starts from the credited balance.
async function makeUser(opts: {
  username: string;
  password: string;
  role: UserRole;
  parentId: number | null;
  mobile: string;
  email?: string;
  balance?: number;
  creditRef?: number;
  rate?: number;
}) {
  const email = opts.email ?? `${opts.username}@kingsbet365.com`;
  const existing = await prisma.user.findUnique({ where: { username: opts.username } });
  if (existing) {
    // Backfill email on already-seeded users.
    if (!existing.email) {
      return prisma.user.update({ where: { id: existing.id }, data: { email } });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      username: opts.username,
      email,
      password: await hash(opts.password),
      passwordText: opts.password, // panel keeps plaintext (legacy xbet behaviour)
      role: opts.role,
      parentId: opts.parentId,
      mobile: opts.mobile,
      balance: opts.balance ?? 0,
      creditRef: opts.creditRef ?? 0,
      rate: opts.rate ?? 100,
      status: "active",
    },
  });
}

// Record a downward credit transfer (parent → child) like the real ledger.
async function credit(senderId: number, receiverId: number, amount: number, note: string) {
  await prisma.transaction.create({
    data: {
      senderId,
      receiverId,
      amount,
      type: "deposit",
      description: note,
      txnRef: `SEED-${senderId}-${receiverId}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    },
  });
}

async function main() {
  // ── Root admin ──
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const admin = await makeUser({
    username: "admin",
    password: adminPassword,
    role: "admin_provider",
    parentId: null,
    mobile: "0000000000",
    balance: 1_000_000,
    creditRef: 1_000_000,
  });
  console.log(`✔ admin_provider (id=${admin.id}) / ${adminPassword}`);

  // ── Hierarchy: admin_provider → owner → partner → super_admin → admin → agent → players ──
  const owner = await makeUser({
    username: "owner1",
    password: "owner123",
    role: "owner",
    parentId: admin.id,
    mobile: "9100000000",
    balance: 500_000,
    creditRef: 500_000,
    rate: 95,
  });
  const partner = await makeUser({
    username: "partner1",
    password: "partner123",
    role: "partner",
    parentId: owner.id,
    mobile: "9100000001",
    balance: 200_000,
    creditRef: 200_000,
    rate: 90,
  });
  const superAdmin = await makeUser({
    username: "superadmin1",
    password: "super123",
    role: "super_admin",
    parentId: partner.id,
    mobile: "9100000002",
    balance: 80_000,
    creditRef: 80_000,
    rate: 85,
  });
  const adminUser = await makeUser({
    username: "admin1",
    password: "admin123",
    role: "admin",
    parentId: superAdmin.id,
    mobile: "9100000003",
    balance: 30_000,
    creditRef: 30_000,
    rate: 80,
  });
  const agent = await makeUser({
    username: "agent1",
    password: "agent123",
    role: "agent",
    parentId: adminUser.id,
    mobile: "9100000004",
    balance: 12_000,
    creditRef: 12_000,
    rate: 75,
  });

  // Record the credit chain (admin_provider funds owner → partner … agent).
  await credit(admin.id, owner.id, 500_000, "Initial credit to owner");
  await credit(owner.id, partner.id, 200_000, "Initial credit to partner");
  await credit(partner.id, superAdmin.id, 80_000, "Initial credit to super admin");
  await credit(superAdmin.id, adminUser.id, 30_000, "Initial credit to admin");
  await credit(adminUser.id, agent.id, 12_000, "Initial credit to agent");

  // ── Players created by the agent (the public can't self-register) ──
  const players = [
    { username: "aziz123", password: "aziz123", mobile: "9120000000", balance: 1000 },
    { username: "azizsila", password: "player123", mobile: "9120000001", balance: 452.38 },
    { username: "player2", password: "player123", mobile: "9120000002", balance: 1200 },
    { username: "player3", password: "player123", mobile: "9120000003", balance: 0 },
  ];
  for (const p of players) {
    const player = await makeUser({
      username: p.username,
      password: p.password,
      role: "player",
      parentId: agent.id,
      mobile: p.mobile,
      balance: p.balance,
    });
    if (p.balance > 0) {
      await credit(agent.id, player.id, p.balance, "Deposit by agent");
    }

    // Give the demo player some casino history so the dashboard isn't empty.
    if (p.username === "azizsila") {
      await prisma.gameCallbackEvent.createMany({
        data: [
          {
            userId: player.id,
            username: player.username,
            action: "bet",
            txnId: `seed-bet-${player.id}-1`,
            gameUid: "sweet-bonanza",
            betAmount: 100,
            amountDelta: -100,
            balanceBefore: 552.38,
            balanceAfter: 452.38,
          },
          {
            userId: player.id,
            username: player.username,
            action: "win",
            txnId: `seed-win-${player.id}-1`,
            gameUid: "sweet-bonanza",
            winAmount: 250,
            amountDelta: 250,
            balanceBefore: 452.38,
            balanceAfter: 702.38,
          },
        ],
        skipDuplicates: true,
      });
    }
  }
  console.log(`✔ hierarchy: owner → partner → super_admin → admin → agent → ${players.length} players`);

  // ── Payment modes (mirrors real xbet_db rows) ──
  const modes = [
    { name: "UPI", channel: "upi", allowedRoles: "admin_provider,partner,super_admin,admin,agent" },
    { name: "Bank Transfer", channel: "bank", allowedRoles: "admin_provider,partner,super_admin,admin,agent" },
    { name: "Cash", channel: "cash", allowedRoles: "admin_provider,partner,super_admin,admin,agent" },
    { name: "Wallet", channel: "wallet", allowedRoles: "admin_provider,partner,super_admin,admin,agent" },
  ] as const;
  for (const m of modes) {
    await prisma.paymentMode.upsert({
      where: { name: m.name },
      update: {},
      create: { name: m.name, channel: m.channel, allowedRoles: m.allowedRoles, enabled: true },
    });
  }
  console.log(`✔ ${modes.length} payment modes`);

  // ── Provider config ──
  const config = [
    { settingKey: "global_margin_percent", settingValue: "11" },
    { settingKey: "max_bet_liability", settingValue: "5000" },
  ];
  for (const c of config) {
    await prisma.providerConfig.upsert({
      where: { settingKey: c.settingKey },
      update: { settingValue: c.settingValue },
      create: c,
    });
  }
  console.log(`✔ ${config.length} provider config rows`);

  // ── Web settings ──
  const hasWeb = await prisma.webSetting.findFirst();
  if (!hasWeb) {
    await prisma.webSetting.create({ data: {} });
    console.log("✔ web settings");
  }

  console.log("\n── Login credentials ──");
  console.log("  admin        / admin1234     (admin_provider — top, infinite)");
  console.log("  owner1       / owner123      (owner)");
  console.log("  partner1     / partner123    (partner)");
  console.log("  superadmin1  / super123      (super_admin)");
  console.log("  admin1       / admin123      (admin)");
  console.log("  agent1       / agent123      (agent)");
  console.log("  azizsila     / player123     (player — has balance 452.38 + casino history)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
