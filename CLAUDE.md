# CLAUDE.md

EasyReceipt: a mobile-first Next.js app for recording household receipts (university
assignment, small scope). See README.md for features and DEPLOY.md for Render setup.

## Deployment

- This web app runs on Render (not Railway, not the local computer).
- Render deploys automatically from the `main` branch of this GitHub repo (https://github.com/triinuviikholm/easyreceipt-web).
- Render build command: `npm ci && npm run build`. Start command: `npm start`
  (`scripts/start.mjs`: `prisma migrate deploy` → `prisma/seed.mjs` → `next start -H 0.0.0.0 -p $PORT`).
- Node 24 LTS (`.node-version`, `engines`). No paid pre-deploy command, no Render Shell.

## Database

- The database is a Render PostgreSQL database.
- It is available only through the server-side `DATABASE_URL` environment variable on Render. Never use `NEXT_PUBLIC_` for it.
- Prisma 6 (`prisma` and `@prisma/client` pinned to the same version). Migrations are committed in `prisma/migrations`.
- New migrations are generated offline, e.g. `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script`
  (or `--from-empty` for the first one) and saved as a new `prisma/migrations/<timestamp>_<name>/migration.sql`.
  The init migration also has a hand-added `LOWER("name")` unique index on Category.
- The seed runs on every start but creates demo data only once (AppMeta `demo-seeded` marker).

## Do not

- Do not set up a local database or connect to one.
- Do not set up or run a local server.
- Do not use `prisma migrate dev`, `prisma db push`, or `prisma migrate reset` against Render.
- Do not force-push.
- Do not add features outside the scope: no auth, budgets, line items, splits, refunds, uploads/OCR,
  AI, exports, recurring expenses, demo reset, or a fake "Scan receipt" button.
- Do not add the "© 2026 EasyReceipt. Built with Claude Code" footer except as its own
  separate task on a branch with a GitHub pull request.

## Conventions

- UI language is English; light mode only; green primary accent; categories always shown as name + color dot.
- Money: integer cents in calculations, decimal strings ("12.49") in the API, displayed as `12,49 €` (`src/lib/money.ts`).
- Dates: receipt dates are calendar dates (`@db.Date`, "YYYY-MM-DD"); "today" and month boundaries use Europe/Tallinn (`src/lib/dates.ts`).
- Validate on the server as well as in the form. API errors are `{ error, fieldErrors? }`; never return raw internal errors.
- Pages are thin server components; data is loaded by client components from the `/api/*` route handlers with `cache: "no-store"`.

## Workflow

- Before every push, run `npm run build` to make sure the app builds. Do not push if the build fails.
- After each finished task, commit and push to GitHub (`main`) so that Render deploys the new version.
- Do not claim deployment or browser testing succeeded unless it was actually verified at the Render URL.
