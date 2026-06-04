# AfroBet216 — VPS Deployment (Hostinger / Ubuntu)

The login 500 happens because the **backend isn't running** and the server has
**no `.env`** (`.env` is gitignored, so `git pull` never brings it). The frontend
calls `/api/...`, Nginx proxies to `:4000`, but nothing is listening → 500.

Fix = create the server `.env`, build, and run both apps under **pm2**, with
Nginx proxying `/api` → backend and everything else → the Next.js app.

Paths below assume `/var/www/afrobet/{client,server}`. Adjust if different.

---

## 0. One-time: install tooling (if missing)

```bash
node -v          # need Node 20+
npm i -g pm2
```

---

## 1. Backend — create `.env`, build, run

```bash
cd /var/www/afrobet/server

# Create the production env (paste your real Neon URL + generated secrets)
nano .env
```

Paste (using your real Neon `DATABASE_URL` and fresh secrets from
`openssl rand -hex 48`):

```ini
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-steep-dew-ap7eak3x-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:PASSWORD@ep-steep-dew-ap7eak3x-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=4000
NODE_ENV=production
CLIENT_ORIGIN="https://afrobet216.com"
JWT_ACCESS_SECRET="<openssl rand -hex 48>"
JWT_REFRESH_SECRET="<openssl rand -hex 48>"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="30d"
COOKIE_DOMAIN="afrobet216.com"
```

Then build & run:

```bash
npm ci
npm run prisma:generate
# schema/seed already applied to Neon from dev — only run if this DB is empty:
# npm run db:push && npm run db:seed
npm run build
pm2 start dist/index.js --name afrobet-api
pm2 save
```

Sanity check the API directly on the box:

```bash
curl -s http://127.0.0.1:4000/api/health
# → {"ok":true,"providers":{...}}
curl -s -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}' -o /dev/null -w "%{http_code}\n"
# → 200
```

If health fails → check `pm2 logs afrobet-api` (usually a bad DATABASE_URL or
missing JWT secret; the env validator prints exactly which var is wrong).

---

## 2. Frontend — point at same-origin API, build, run

The client calls `process.env.NEXT_PUBLIC_API_URL` (falls back to localhost).
In production we want it to call the **same domain** so Nginx can proxy it:

```bash
cd /var/www/afrobet/client
echo 'NEXT_PUBLIC_API_URL=https://afrobet216.com/api' > .env.production
echo 'NEXT_PUBLIC_SITE_URL=https://afrobet216.com' >> .env.production

npm ci
npm run build
pm2 start npm --name afrobet-web -- start   # next start, defaults to :3000
pm2 save
```

> `NEXT_PUBLIC_*` vars are baked at **build time** — you must rebuild the client
> whenever you change them.

---

## 3. Nginx — proxy /api → :4000, everything else → :3000

`/etc/nginx/sites-available/afrobet216.com`:

```nginx
server {
    listen 80;
    server_name afrobet216.com www.afrobet216.com;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -sf /etc/nginx/sites-available/afrobet216.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
# HTTPS:
certbot --nginx -d afrobet216.com -d www.afrobet216.com
```

---

## 4. Verify

```bash
curl -s https://afrobet216.com/api/health        # → {"ok":true,...}
pm2 list                                          # afrobet-api + afrobet-web online
```

Then log in at https://afrobet216.com with `admin / admin1234`.

---

## 5. Redeploy after code changes (push/pull workflow)

On your machine: `git push`. On the VPS:

```bash
cd /var/www/afrobet
git pull
# backend changed:
cd server && npm ci && npm run prisma:generate && npm run build && pm2 restart afrobet-api
# frontend changed:
cd ../client && npm ci && npm run build && pm2 restart afrobet-web
```

Neon (serverless Postgres) is shared between dev and prod, so schema changes you
push from dev with `prisma db push` are already live — no DB step needed on the
VPS unless you reset/seed.

---

## Common gotchas

- **500 on /api/auth/login** → backend down or `.env` missing. `pm2 logs afrobet-api`.
- **404 on /promotions, /instant, /live-sports** → those player pages aren't built
  yet (known TODO), unrelated to login.
- **CORS error** → `CLIENT_ORIGIN` in server `.env` must equal `https://afrobet216.com`.
- **NEXT_PUBLIC_API_URL not taking effect** → you must `npm run build` the client again.
