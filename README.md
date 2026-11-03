# EasyReceipt

EasyReceipt is a small, mobile-first web app for recording household receipts and seeing
where the money goes: monthly totals, a comparison with last month, and a breakdown by
category.

## Shared demo — please use fictional data

This first version is a **public shared demo without accounts**. Everyone who opens the
app sees and can change the same receipts and categories. The app shows a permanent notice:

> Shared demo — everyone can view and edit this data. Please use fictional receipts.

All data is stored in PostgreSQL and survives reloads and redeploys (as long as the same
database exists — see [DEPLOY.md](DEPLOY.md) about the free database's 30-day limit).

## Features

- **Dashboard** — month selector (no future months), total spent, comparison with the same
  period last month (current month) or the previous month (completed months), spending by
  category with bars and percentages, and the five latest receipts.
- **Receipts** — newest first, search by store, filter by category and month (or all
  months), edit, and delete with confirmation.
- **Add / edit receipt** — store, date (today or earlier), amount (`12,49` or `12.49`),
  category (defaults to “Other”), payment method (Card/Cash), optional note.
  “Save and add another” on the add page.
- **Categories** — add, rename, recolor (8 preset colors), delete when unused. “Other” is the
  guaranteed default: it can be recolored but not renamed or deleted.

Money is shown as `12,49 €`. Calendar boundaries use the Europe/Tallinn timezone.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4, a few hand-written shadcn/ui-style components (Radix Alert Dialog), Lucide icons
- Prisma 6 ORM + PostgreSQL (Render)
- Node.js 24 LTS, npm (`package-lock.json` committed)
- Hosted as a Render Node web service, auto-deployed from `main`

## Main commands

| Command | What it does |
| --- | --- |
| `npm ci` | Install exact dependency versions |
| `npm run build` | `prisma generate` + `next build`. Needs no database. Run before every push. |
| `npm start` | Production start (used by Render): `prisma migrate deploy` → one-time seed → `next start` on `0.0.0.0:$PORT` |
| `npm run seed` | Run the safe one-time initialization manually (needs `DATABASE_URL`) |
| `npm run typecheck` | TypeScript check |
| `npm run migration:sql` | Print the SQL for the schema from scratch (offline, no database) |

There is no local database or local server for this project; the app is tested at its
public Render URL. Deployment instructions: **[DEPLOY.md](DEPLOY.md)**.

## Project layout

```
prisma/schema.prisma          data model (Category, Receipt, AppMeta)
prisma/migrations/            committed SQL migrations
prisma/seed.mjs               one-time demo data (7 categories, 10 sample receipts)
scripts/start.mjs             production start sequence
src/app/api/...               route handlers (receipts, categories, stats)
src/app/...                   pages: dashboard, receipts, add/edit, categories
src/lib/                      money, dates, validation, Prisma client
```

## Manual verification checklist (at the deployed URL)

- [ ] Open the app on desktop and on a phone (or a ~375px wide browser window).
- [ ] Navigation works: sidebar on desktop, menu button on mobile; no horizontal scrolling.
- [ ] The shared-demo notice is visible on every page.
- [ ] Sample data exists: 7 categories and 10 receipts with the note “Sample”, split between this month and last month.
- [ ] Dashboard total for this month equals the sum of this month's receipts in the Receipts list.
- [ ] Add a receipt with `12,49` and another with `12.49`; both show as `12,49 €`.
- [ ] Rejected with a clear message: blank store, `0`, `-5`, `1,234`, and a future date.
- [ ] A failed save keeps what you typed; buttons show “Saving…” while saving.
- [ ] “Save and add another” stays on the form, shows a confirmation and resets the fields.
- [ ] “Save receipt” returns to Receipts with “Nice! Receipt saved” and the receipt visible.
- [ ] Edit a receipt (amount or category) and check the dashboard totals update.
- [ ] Delete a receipt — a confirmation dialog appears first; the list refreshes.
- [ ] Search by store (case-insensitive) combined with category and month filters.
- [ ] “All months” shows everything; an empty database and “no matches” show different messages.
- [ ] Month comparison: the current month says “… vs same period last month”; a past month says “… vs previous month”.
- [ ] Zero comparison: pick the oldest month with receipts (its previous month is empty) → “No spending in the comparison period”; a month with no receipts at all → “No spending in either period”.
- [ ] Categories: add, rename, change color, delete an unused one.
- [ ] Deleting a category that has receipts is not possible (and the API returns 409).
- [ ] Duplicate names are rejected, including different case or extra spaces (`groceries `).
- [ ] “Other” can change color but cannot be renamed or deleted.
- [ ] Reload, and open the app in another browser/device: the same data is there.
- [ ] Trigger a redeploy on Render: data is still there and sample receipts are not duplicated.
- [ ] Delete all receipts, redeploy: samples do **not** come back.

## Known limitations and deferred features

- No accounts or private household data — it is one shared demo dataset.
- No budgets, receipt line items, split categories, refunds, uploads/scanning/OCR, AI,
  exports, recurring expenses, or demo reset.
- The receipts list shows up to 500 matching receipts; no pagination or custom sorting.
- Month selectors list the last 24 months; older receipts appear under “All months”.
- The free Render web service sleeps when idle; the first visit can take about a minute,
  and Render (not this app) shows the waiting screen.
- The free Render database expires after 30 days unless upgraded (see DEPLOY.md).
- No automated test suite; verification is the manual checklist above.
