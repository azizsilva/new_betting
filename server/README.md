# KingsBet365 — Backend

Express + TypeScript + Prisma + Neon (Serverless Postgres). A faithful port of
the **xbet** agent-credit-network logic, rebuilt to be secure, atomic and fast.

> For the high-level product overview see the [root README](../README.md).
> This file is the backend developer reference.

---

## 1. Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Runtime        | Node.js + `tsx` (dev) / `tsc` (build)    |
| Framework      | Express 4                                |
| ORM            | Prisma 6                                 |
| Database       | Neon Serverless Postgres (via `@prisma/adapter-neon`) |
| Auth           | JWT (access + refresh) · argon2id        |
| Validation     | Zod                                      |
| Logging        | pino + pino-http                         |
| Security       | helmet · cors · express-rate-limit       |

---

## 2. Project layout

```
server/
├─ prisma/
│  ├─ schema.prisma      # full data model (mirrors xbet_db on Postgres)
│  └─ seed.ts            # builds the role hierarchy + demo data
└─ src/
   ├─ config/env.ts      # zod-validated environment
   ├─ lib/
   │  ├─ prisma.ts       # Neon-adapter Prisma client (singleton)
   │  ├─ tokens.ts       # JWT sign/verify + session token
   │  ├─ password.ts     # argon2 hash/verify
   │  ├─ errors.ts       # AppError + typed helpers (BadRequest, Forbidden…)
   │  └─ logger.ts       # pino
   ├─ middleware/
   │  ├─ auth.ts         # authenticate + requireRole
   │  └─ error.ts        # asyncHandler + error/notFound handlers
   ├─ domain/
   │  └─ hierarchy.ts    # ROLE_ORDER, creatableRoles, canManage, childRole
   ├─ services/
   │  ├─ auth.service.ts        # login, createUser, refresh, sanitize
   │  ├─ user.service.ts        # downline, subtree, stats, status
   │  ├─ wallet.service.ts      # transfer (deposit/withdraw), balance
   │  └─ gameCallback.service.ts# idempotent bet/win/refund
   ├─ providers/         # casino provider HTTP clients (Gambly, iGaming)
   ├─ routes/            # auth, users, wallet, casino, settings
   ├─ app.ts             # express app (middleware + routers)
   └─ index.ts           # http server bootstrap
```

---

## 3. The role hierarchy (the heart of the system)

Defined in [`src/domain/hierarchy.ts`](src/domain/hierarchy.ts). Top → bottom:

```
admin_provider → owner → partner → super_admin → admin → agent → player
```

- **`admin_provider`** — platform owner, the **infinite money source** (top).
- **`super_admin`** — one level above `admin`.
- **`admin`** — level-5 role that manages **agents** (this is NOT the top role).
- **`agent`** — the "shop"; manages players.
- **`player`** — bets only; cannot access the panel.

Helper functions:
- `ROLE_ORDER` — the ordered chain (lower index = more authority)
- `creatableRoles(role)` — which roles a user may create (admin_provider & owner
  may create any descendant; everyone else only the single role directly below)
- `childRole(role)` — the one role directly beneath
- `canManage(actor, target)` — true if actor outranks target
- `isStaff(role)` / `isPlayer(role)`

This mirrors xbet's `admin_child_role()` / `admin_parent_role()` from
`wamp64/www/xbet/admin/includes/auth.php`.

---

## 4. Money model & flow

Each `User` row carries `balance`, `creditRef`, `exposure`, `rate`
(all `Decimal(15,2)`). Available = `balance + creditRef − exposure`.

**Transfers** ([`src/services/wallet.service.ts`](src/services/wallet.service.ts)):

- `deposit` → actor (parent) debited, target (child) credited
- `withdrawal` → child debited, parent credited
- **admin_provider is infinite**: never debited/credited, no balance check
- Non-admin givers are balance-checked (`Insufficient balance`)
- Runs in a **serializable Prisma transaction**; writes one `Transaction` ledger
  row + an `AuditLog` entry per move

**Casino callbacks** ([`src/services/gameCallback.service.ts`](src/services/gameCallback.service.ts)):

- `POST /casino/callback` — idempotent on `(txnId, action)`; a replay returns the
  prior result (no double charge)
- `bet` debits, `win`/`refund` credit; logs `GameCallbackEvent` with
  `balanceBefore`/`balanceAfter`

---

## 5. Security model (enforced server-side)

1. **authenticate** — verifies the JWT access token, sets `req.user`.
2. **requireRole(...roles)** — gate a route by role.
3. **creatableRoles** — a user may only create the role(s) below them.
4. **direct-child scope** — transfers/management only on the actor's own
   children (`target.parentId === actor.id`, or admin_provider).
5. **balance guard** — non-admin can't transfer more than they hold.
6. **rate limiting** — 300 req/min global (tighten per route as needed).
7. **helmet + cors** — standard hardening; CORS locked to `CLIENT_ORIGIN`.

Passwords are **argon2id** (xbet used md5). Refresh handled via `/auth/refresh`.

---

## 6. API reference

Base: `/api`

### Auth
- `POST /auth/login` — `{ username, password }` → `{ user, accessToken, refreshToken }`
- `POST /auth/refresh` — `{ refreshToken }` → new tokens
- `POST /auth/logout` — clears session token (auth required)
- `GET  /auth/me` — current user with fresh balance (auth required)

### Users (staff only, role-scoped)
- `POST  /users` — create a user below you (role-gated)
- `GET   /users/downline` — direct children (+ `availBalance`, `childrenCount`)
- `GET   /users/stats` — aggregate totals for the stats bar
- `GET   /users/subtree` — full recursive subtree
- `GET   /users/:id` — a managed user
- `PATCH /users/:id/status` — `active | locked | suspended`

### Wallet
- `GET  /wallet/balance` — balance / exposure / available
- `GET  /wallet/transactions` — ledger (direction + counterparty)
- `POST /wallet/transfer` — `{ targetUserId, amount, type: deposit|withdrawal, description? }`

### Casino & settings
- `GET  /casino/recent` — player's recent games
- `POST /casino/callback` — provider bet/win/refund (server-to-server)
- `GET  /settings/web` — public site settings
- `GET  /settings/payment-modes` — enabled payment modes
- `GET  /health` — status + configured providers

---

## 7. Environment (`.env`)

```ini
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require   # pooled
DIRECT_URL=postgresql://...neon.tech/neondb?sslmode=require     # migrations
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

JWT_ACCESS_SECRET=...        # openssl rand -hex 48
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# Casino providers (fill when ready)
IGAMING_API_BASE_URL=
IGAMING_API_KEY=
IGAMING_OPERATOR_ID=
GAMBLY_API_BASE_URL=
GAMBLY_API_KEY=

# PSP (optional)
PSP_API_BASE_URL=
PSP_API_KEY=
PSP_WEBHOOK_SECRET=
```

Env is validated at boot by [`src/config/env.ts`](src/config/env.ts); the server
exits with a clear message if anything is missing/invalid.

---

## 8. Scripts

```bash
npm run dev            # tsx watch (hot reload)
npm run build          # tsc → dist/
npm run start          # node dist/index.js
npm run prisma:generate
npm run db:push        # sync schema to Neon (prisma db push)
npm run db:seed        # seed hierarchy + demo data
npm run prisma:studio  # browse the DB
```

### Dev workflow notes (Windows)
- The `tsx watch` process holds the Prisma query-engine DLL. If
  `prisma generate` / `db push` fails with `EPERM … query_engine…dll`, stop the
  dev server first (`taskkill /F /IM node.exe`), regenerate, then restart.
- Renaming an enum value requires a reset on dev: `prisma db push --force-reset`
  then `npm run db:seed` (old rows hold the old value).

---

## 9. Seeded accounts

| Username      | Password    | Role           |
| ------------- | ----------- | -------------- |
| `admin`       | `admin1234` | admin_provider |
| `owner1`      | `owner123`  | owner          |
| `partner1`    | `partner123`| partner        |
| `superadmin1` | `super123`  | super_admin    |
| `admin1`      | `admin123`  | admin          |
| `agent1`      | `agent123`  | agent          |
| `azizsila`    | `player123` | player         |

The seed wires the credit chain (admin_provider funds owner → … → agent funds
players) with real ledger rows and gives `azizsila` balance 452.38 + casino
history.

---

## 10. Verified behaviour (tested live)

| Scenario                                   | Result                                            |
| ------------------------------------------ | ------------------------------------------------- |
| agent → create partner                     | ❌ `A agent cannot create a partner`              |
| agent → create player                      | ✅ created (parent = the agent)                   |
| admin → create player (skip level)         | ❌ `A admin cannot create a player`               |
| admin → create agent                       | ✅ created                                        |
| agent → fund a non-child                   | ❌ `You can only transact with your direct downline` |
| player → create user                       | ❌ `Insufficient permissions`                     |
| admin_provider → deposit                   | ✅ infinite source, balance unchanged             |
| over-balance transfer                      | ❌ `Insufficient balance`                         |
| money flow admin_provider → … → player     | ✅ balances conserved at every hop                |
