# KingsBet365 — Platform Documentation

A casino + agent-network betting platform modelled on the **xbet** workflow,
rebuilt with a modern, fast, scalable stack.

- **Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/vaul ·
  TanStack Query · Zustand · nuqs · Framer Motion · Embla
- **Backend:** Node.js · Express · TypeScript · Prisma · Neon (Serverless Postgres)
- **Auth:** JWT (access + refresh) · argon2 password hashing
- **Design:** FCBET216 layout language, KingsBet365 black + gold theme
- **Providers:** Gambly + iGamingAPIs (casino games)

> The data model and money logic are a faithful port of the real `xbet_db`
> (MySQL) and the xbet admin PHP source, translated to Postgres/Prisma.

---

## 1. The core idea — an agent credit network

This is **not** a normal "sign up with a card" casino. It is a **multi-tier
credit-distribution network**. There is **no public registration** — accounts
are created top-down by staff. Money is *credit* that flows **down** a tree and
settles **up**.

### The hierarchy (one `users` table, self-referencing via `parentId`)

```
admin_provider ──▶ owner ──▶ partner ──▶ super_admin ──▶ admin ──▶ agent (shop) ──▶ player
```

Every account — from the admin_provider down to a player — is a single row in
`users` with a `role` and a `parentId` pointing at whoever created/owns it.

| Role               | Creates (the "Add X" button) | Funds (deposit/withdraw to)         |
| ------------------ | ---------------------------- | ----------------------------------- |
| **admin_provider** | owner (and any descendant)   | owner — **infinite source**         |
| **owner**          | partner (and any below)      | partner                             |
| **partner**        | super_admin                  | super_admin                         |
| **super_admin**    | admin                        | admin                               |
| **admin**          | agent (the "shop")           | agent                               |
| **agent**          | player                       | player                              |
| **player**         | — (nobody)                   | — (places bets only)                |

> Note on naming: the **top** role is `admin_provider` (the platform owner /
> infinite source). The role named **`admin`** sits at level 5 and manages
> agents — it is NOT the top. `super_admin` is one level above it.

Source of truth in code:
- Backend chain: [`server/src/domain/hierarchy.ts`](server/src/domain/hierarchy.ts) → `ROLE_ORDER`, `creatableRoles`, `canManage`
- Mirrors xbet's `admin_child_role()` / `admin_parent_role()` from `wamp64/www/xbet/admin/includes/auth.php`

---

## 2. Money model — balances & the credit flow

Each user row carries its own money columns (Postgres `Decimal(15,2)`):

| Column      | Meaning                                                        |
| ----------- | -------------------------------------------------------------- |
| `balance`   | Spendable money the user currently holds                       |
| `creditRef` | Credit reference / limit extended by the parent                |
| `exposure`  | Money locked in open bets / game rounds                        |
| `rate`      | Partnership / commission rate (%) — default 100                |
| `status`    | `active` · `locked` · `suspended`                              |

**Available balance** = `balance + creditRef − exposure` (xbet's formula).

### How a deposit works (parent → child)

```
agent deposits 500 to player:
  agent.balance   −= 500   (giver debited)
  player.balance  += 500   (receiver credited)
  + one row in `transactions` (sender_id, receiver_id, amount, type, txn_ref)
```

### How a withdrawal works (child → parent)

```
agent withdraws 200 from player:
  player.balance  −= 200
  agent.balance   += 200
  + one `transactions` row
```

### Admin = infinite source

The **admin** is never debited or credited by a transfer (matches xbet's
`if ($role !== 'admin')`). Admin can fund the tree without limit; everyone
else is constrained by their own balance.

All of this lives in
[`server/src/services/wallet.service.ts`](server/src/services/wallet.service.ts)
and runs inside a **serializable Prisma transaction**, so balances can never
drift and a ledger row always matches the balance change.

---

## 3. Security & privilege enforcement (backend, not just UI)

Every rule below is enforced **server-side** — the UI only mirrors it.

1. **Auth** — `POST /auth/login` returns a JWT access token (15m) + refresh
   token (30d). Passwords are **argon2id** hashed (xbet used md5; this is far
   stronger). A `sessionToken` is stored on the user row.
2. **Role gate** — `requireRole(...)` middleware blocks routes by role.
3. **Creation gate** — a role may only create the role(s) returned by
   `creatableRoles(actorRole)` (admin/owner can create any descendant; everyone
   else only the single role directly below).
4. **Scope gate** — transfers and user management only work on the actor's
   **own downline** (`target.parentId === actor.id`, or admin).
5. **Balance guard** — non-admin givers cannot transfer more than they hold.

### Verified privilege matrix (tested live)

| Attempt                                   | Result                                            |
| ----------------------------------------- | ------------------------------------------------- |
| agent → create **partner**                | ❌ `A agent cannot create a partner`              |
| agent → create **player**                 | ✅ created (parent = the agent)                   |
| admin → create **player** (skip level)    | ❌ `A admin cannot create a player`               |
| admin → create **agent**                  | ✅ created                                        |
| agent → fund a user that isn't his child  | ❌ `You can only transact with your direct downline` |
| player → create a user                    | ❌ `Insufficient permissions`                     |
| player → open `/panel`                    | ❌ redirected to `/profile`                       |
| admin_provider → deposit (infinite)       | ✅ admin_provider balance never drops             |

---

## 4. Database schema (Prisma / Postgres — mirrors xbet_db)

Defined in [`server/prisma/schema.prisma`](server/prisma/schema.prisma).

| Model                 | xbet table              | Purpose                                            |
| --------------------- | ----------------------- | -------------------------------------------------- |
| `User`                | `users`                 | The whole hierarchy (role + parentId + money)      |
| `Transaction`         | `transactions`          | Credit transfers between two users (sender→receiver)|
| `Payment`             | `payments`              | Richer deposit/withdrawal with fees + mode         |
| `PaymentMode`         | `payment_modes`         | UPI / Bank / Cash / Wallet, allowed roles          |
| `Settlement`          | `settlements`           | Settling balances between two users                |
| `BonusLedger`         | `bonus_ledger`          | Bonus point movements                              |
| `LoyaltyLedger`       | `loyalty_ledger`        | Loyalty point movements                            |
| `DepositMethod`       | `deposit_methods`       | Methods an owner exposes to a target role          |
| `PlayerDepositMethod` | `player_deposit_methods`| Methods an agent exposes to its players            |
| `UserDepositMethod`   | `user_deposit_methods`  | A user's own configured methods                    |
| `UserWithdrawBank`    | `user_withdraw_banks`   | A user's bank slots for withdrawals                |
| `GameCallbackEvent`   | `game_callback_events`  | Idempotent casino bet/win/refund log w/ balances   |
| `GameRoundExposure`   | `game_round_exposures`  | Per-round exposure tracking                        |
| `RecentGame`          | `recent_games`          | A player's recently played games                   |
| `ProviderConfig`      | `provider_config`       | Global settings (margin %, max liability)          |
| `SbMatch`             | `sb_matches`            | Sportsbook fixtures (kept for parity; unused)      |
| `MarketExposure`      | `market_exposure`       | Sportsbook risk (kept for parity; unused)          |
| `AuditLog`            | `audit_logs`            | Who did what (actor, action, entity, ip)           |
| `SystemSetting`       | `system_settings`       | Key/value system config                            |
| `WebSetting`          | `web_settings`          | Site logo, social links, login/signup toggles      |

---

## 5. Casino game flow (idempotent provider callbacks)

When a game provider (Gambly / iGamingAPIs) reports a bet/win/refund, it calls
`POST /casino/callback`. Handled by
[`server/src/services/gameCallback.service.ts`](server/src/services/gameCallback.service.ts):

- **Idempotent** — unique on `(txnId, action)`. A replayed callback returns the
  prior result instead of double-charging.
- `bet` debits balance, `win`/`refund` credit it.
- Every call writes a `GameCallbackEvent` row with `balanceBefore` /
  `balanceAfter` for a full audit trail.
- Atomic + serializable, with an insufficient-balance guard on bets.

---

## 6. API surface

Base URL: `/api`

### Auth
| Method | Path             | Notes                                  |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/auth/login`    | username + password → tokens + user    |
| POST   | `/auth/refresh`  | refresh token → new tokens             |
| POST   | `/auth/logout`   | clears session token                   |
| GET    | `/auth/me`       | current user (fresh balance)           |

### Users (staff only, role-scoped)
| Method | Path                  | Notes                                       |
| ------ | --------------------- | ------------------------------------------- |
| POST   | `/users`              | create a user below you (role-gated)        |
| GET    | `/users/downline`     | your direct children (+ availBalance, count)|
| GET    | `/users/stats`        | totals across your downline (stats bar)     |
| GET    | `/users/subtree`      | full recursive subtree                      |
| GET    | `/users/:id`          | a managed user                              |
| PATCH  | `/users/:id/status`   | active / locked / suspended                 |

### Wallet
| Method | Path                    | Notes                                  |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/wallet/balance`       | balance / exposure / available         |
| GET    | `/wallet/transactions`  | your ledger (in/out + counterparty)    |
| POST   | `/wallet/transfer`      | deposit (down) / withdrawal (up)       |

### Casino & settings
| Method | Path                       | Notes                          |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/casino/recent`           | player's recent games          |
| POST   | `/casino/callback`         | provider bet/win/refund (s2s)  |
| GET    | `/settings/web`            | public site settings           |
| GET    | `/settings/payment-modes`  | enabled payment modes          |
| GET    | `/health`                  | status + configured providers  |

---

## 7. Frontend — what each role sees

Role-based redirect after login
([`client/src/lib/auth-api.ts`](client/src/lib/auth-api.ts) `landingForRole`):

- **player** → `/profile` — personal dashboard (balance, bonus, deposit/withdraw,
  personal info, operations, KYC, notifications). No "My Bets".
- **all staff** → `/panel` — the back-office, role-aware:
  - **Dashboard** (`/panel/users`) — stats bar + downline table with every xbet
    column (Balance, Credit Ref, Exposure, Rate, Avail. Bal.) + inline **D / W**
    buttons + lock/suspend toggle.
  - **Create User** (`/panel/create`) — only the role(s) you may create.
  - **Transfer** (`/panel/transfer`) — deposit/withdraw to a chosen downline user.
  - **Transfer History** (`/panel/transfers`) — your ledger.
  - **Game Report / Casino Bets** — placeholders (wiring next).

Everything is **real-time**: TanStack Query refetches downline/stats/balance after
each mutation; **sonner** toasts confirm every action. Auth + UI state in **Zustand**.

---

## 8. Seeded accounts (run `npm run db:seed` in `server/`)

| Username       | Password    | Role          | Lands on  |
| -------------- | ----------- | ------------- | --------- |
| `admin`        | `admin1234` | admin_provider | /panel   |
| `owner1`       | `owner123`  | owner          | /panel   |
| `partner1`     | `partner123`| partner        | /panel   |
| `superadmin1`  | `super123`  | super_admin    | /panel   |
| `admin1`       | `admin123`  | admin          | /panel   |
| `agent1`       | `agent123`  | agent (shop)   | /panel   |
| `azizsila`     | `player123` | player         | /profile |

The seed builds the full credit chain (admin funds owner → … → agent funds
players) with real ledger rows, and gives `azizsila` a balance of 452.38 plus
casino history.

---

## 9. Running it

```bash
# Backend (port 4000)
cd server
npm install
npm run db:push        # sync schema to Neon
npm run db:seed        # create the hierarchy + demo data
npm run dev

# Frontend (port 3000)
cd client
npm install
npm run dev
```

Environment: `server/.env` holds the Neon `DATABASE_URL` / `DIRECT_URL`, JWT
secrets, and provider keys (Gambly / iGamingAPIs).

---

## 10. How this maps to xbet, and where it differs

**Same as xbet**
- The role hierarchy, `parentId` tree, and downline scoping
- `balance` / `credit_ref` / `exposure` / `rate` semantics + available-balance formula
- Deposit-down / withdraw-up credit flow; admin as infinite source
- Idempotent game callbacks with running balances
- The `users`-centric single-table model and all the supporting tables

**Improved**
- **argon2** password hashing instead of md5
- **Postgres/Neon + Prisma** instead of raw MySQL/PDO
- **Atomic serializable transactions** for all money moves
- **Backend-enforced** privileges (validated, not just hidden in the UI)
- Modern real-time frontend (TanStack Query + Zustand) instead of PHP page reloads
```
