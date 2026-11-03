# Deploying EasyReceipt on Render

This guide sets up a free Render PostgreSQL database and a free Render web service that
deploys automatically from the `main` branch of the `easyreceipt-web` GitHub repository.
Information checked against Render's documentation in November 2026 — Render's free plans
can change, so glance at <https://render.com/docs/free> before relying on limits.

> **Timing tip:** create the free database only when you are ready to deploy. Its 30-day
> free period starts the moment it is created.

## 1. Create a Render account and connect GitHub

1. Go to <https://render.com> and sign up (signing up with GitHub is easiest).
2. When Render asks for repository access, allow it to see `easyreceipt-web`
   (either “All repositories” or just that one).

## 2. Create the free PostgreSQL database

1. In the Render Dashboard click **New → Postgres**.
2. **Name:** `easyreceipt-db` (any name works). Leave *Database* and *User* empty (Render generates them).
3. **Region:** pick one, e.g. *Frankfurt (EU Central)*. **Remember it** — the web service must use the same region.
4. **PostgreSQL version:** keep the default.
5. **Instance type:** **Free**.
6. Click **Create Database** and wait until its status is *Available*.

## 3. Create the web service

1. Click **New → Web Service**.
2. Choose **Git Provider → GitHub** and select the `easyreceipt-web` repository.
3. Fill in:

   | Setting | Value |
   | --- | --- |
   | Name | `easyreceipt` (becomes part of the URL) |
   | Language / Runtime | **Node** |
   | Branch | `main` |
   | Region | **the same region as the database** (step 2) |
   | Root Directory | leave empty |
   | Build Command | `npm ci && npm run build` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

## 4. Same region

The database's *Internal* URL only works for services in the same region. If you picked a
different region by mistake, delete the web service and create it again in the right region.

## 5. Set DATABASE_URL (internal URL)

1. Open the **database** → **Connect** (top right) or the **Info** page → copy the
   **Internal Database URL** (starts with `postgresql://`, host has no `.render.com` domain).
2. Open the **web service** → **Environment** → **Add Environment Variable**:
   - Key: `DATABASE_URL`
   - Value: the Internal Database URL
3. Save. (You can also add it in the *Environment Variables* section while creating the service.)

Do **not** set `NODE_ENV` yourself — the build needs dev dependencies, and `next start`
sets production mode on its own. Never put the URL in a `NEXT_PUBLIC_` variable or in Git.

## 6. Node version, build and start commands

- **Node version:** the repo pins Node 24 LTS through `.node-version` (`24`) and
  `package.json` `"engines": { "node": "24.x" }`. Render reads these automatically; you do
  not need a `NODE_VERSION` variable. (If you set one, use `24`.)
- **Build command:** `npm ci && npm run build` — installs exact versions, generates the
  Prisma Client and builds Next.js. It does **not** touch the database.
- **Start command:** `npm start` — runs `scripts/start.mjs`, which
  1. applies committed migrations (`prisma migrate deploy`),
  2. runs the safe one-time initialization (`prisma/seed.mjs`),
  3. starts Next.js on `0.0.0.0` and Render's `PORT`.

  If step 1 or 2 fails, the service stops with a log message instead of starting a broken app.
  No paid *Pre-Deploy Command* and no Render Shell are needed.

## 7. Automatic deploys from main

Web service → **Settings → Build & Deploy → Auto-Deploy** → **On Commit** (the default).
Every push to `main` now builds and deploys a new version.

## 8. The first deploy: migration and seed

Click **Create Web Service** (or **Manual Deploy → Deploy latest commit**). In the logs you
should see, in order:

1. the build (`npm ci`, `prisma generate`, `next build`) ending with *Build successful*;
2. `[start] Applying database migrations…` and Prisma applying `20261103000000_init`;
3. `[seed] Demo data created (7 categories, 10 sample receipts).`;
4. `[start] Starting EasyReceipt on 0.0.0.0:10000` and Next.js *Ready*.

On every later deploy, step 2 says no pending migrations and step 3 says
`[seed] Already initialized — nothing to do.` The seed writes a permanent marker the first
time, so deleted samples are never recreated, renamed categories are not overwritten, and
data is not duplicated — even if you delete every receipt.

## 9. Public URL and logs

- **Public URL:** at the top of the web service page, e.g. `https://easyreceipt.onrender.com`.
- **Deploy history / build logs:** web service → **Events** (click a deploy to see its logs).
- **Runtime logs:** web service → **Logs** (API errors are logged as `[api] … failed: …`).

## 10. What “free” means here

- **Free web services sleep.** After 15 minutes without traffic the service spins down.
  The next visit wakes it, which takes about a minute; during that time Render shows its
  own loading page — EasyReceipt can't display anything until the service is running.
  Free services share 750 instance hours per month per workspace.
- **Free PostgreSQL expires 30 days after creation.** After that you have a 14-day grace
  period to upgrade to a paid database; otherwise Render deletes it **with all data**.
  Render emails you before this happens. Only one free database per workspace; 1 GB storage; no backups.
- **Data survives normal redeploys and restarts** as long as the same database still exists.
- **To keep the data beyond the free period, upgrade the database** to a paid instance
  type (database → **Settings / Instance type**). Do not count on free storage being permanent.

## 11. Troubleshooting

Before sharing any log, **redact secrets**: replace passwords, the full `DATABASE_URL`
and hostnames with `***`.

| Symptom | What to check |
| --- | --- |
| **Build fails** at `npm ci` | `package-lock.json` must be committed and in sync with `package.json`. Run `npm install` locally, commit the lockfile, push. |
| **Build fails** at `next build` / TypeScript | Run `npm run build` locally, fix the error, push. Make sure `NODE_ENV` is not set to `production` in Render's environment. |
| `[start] DATABASE_URL is not set` | Add `DATABASE_URL` under the web service's **Environment** and redeploy. |
| **Migration fails**: `P1001 Can't reach database server` | Use the **Internal** URL, and make sure the database and web service are in the **same region** and the database is *Available* (not expired/suspended). |
| **Migration fails**: authentication error | Re-copy the Internal Database URL (no extra spaces or quotes) and redeploy. |
| **Migration fails**: `P3009 failed migrations` | A previous migration attempt failed half-way. Note the migration name and ask for help before changing the database. |
| `[seed] Initialization failed` | Usually a connection problem — same checks as above. Redeploying is safe; the seed never duplicates data. |
| Deploy times out / “No open ports detected” | Start Command must be exactly `npm start` (it binds to `0.0.0.0:$PORT`). Check the **Logs** for an earlier error. |
| App shows “We couldn't reach the database right now” | The database is unavailable or expired. Check its status on Render, then use **Try again**. |
| First page load takes ~1 minute | Normal for a sleeping free service. |
