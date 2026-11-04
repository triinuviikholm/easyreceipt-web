Build the first version of **EasyReceipt**, a mobile-first web app for recording receipts and understanding household spending.

This is a university assignment with a total budget of 3–4 hours. Implement a complete, simple working demo and prepare it for deployment. Make reasonable implementation decisions without asking about minor details.

**1. Project context and working rules**

- Existing project: `C:\projects\easyreceipt-web`.
- Existing GitHub repository: `easyreceipt-web`, currently containing only a README.
- Inspect the repository, Git status, remotes, and any existing `CLAUDE.md` before changing files. Preserve unrelated work.
- Code is developed locally. You may install dependencies and run build checks locally.
- Do not run a local web server or create/connect to a local database.
- The only runtime database is Render PostgreSQL. Real browser testing happens after deployment at the public Render URL.
- I will create the Render account, database, and web service myself using your instructions.
- Implement the app, run `npm run build`, fix failures, make meaningful commits, and push to the existing GitHub repository’s `main` branch.
- `npm run build` must pass before every push. Do not force-push.
- If GitHub authentication blocks pushing, keep the completed local work and explain the specific action I need to take.
- A `CLAUDE.md` was created in an earlier session. Read it first, then update it with these project conventions, scope, build requirement, and deployment workflow (Render, not Railway).
- Commit after each major part (project setup, database and seed, receipts, dashboard, categories, docs) so the work is safe if the session stops because of usage limits. Keep commit messages short and descriptive.
- Do not claim that deployment or browser testing succeeded unless it was actually verified.

**2. Product scope**

EasyReceipt helps households record expenses and see monthly totals and category breakdowns.

The user interface language is English.

This first version is a **public shared demo without authentication**:
- All visitors see and can change the same receipts and categories.
- There are no private accounts or separate household workspaces.
- Show a small, persistent notice: “Shared demo — everyone can view and edit this data. Please use fictional receipts.”
- All receipt and category data must be stored in PostgreSQL and survive page reloads and app redeploys.

Include only:
- Dashboard.
- Receipts list with filters.
- Add/edit receipt.
- Category management.

Do not add authentication, budgets, receipt line items, category splitting, refunds, uploads, OCR, AI features, exports, recurring expenses, or a demo-reset button. Do not show a nonfunctional “Scan receipt” button.

Do not add the footer “© 2026 EasyReceipt. Built with Claude Code”. That exact footer must be added later as a separate assignment task through a branch and GitHub pull request. Do not perform that later task now.

**3. Required stack**

- Next.js with App Router and TypeScript.
- Tailwind CSS.
- Minimal shadcn/ui components: use only what is useful.
- Lucide React icons.
- Prisma ORM with PostgreSQL.
- npm with a committed package-lock.json.
- Render Node web service, automatically deployed from GitHub `main`.

Choose mutually compatible stable package versions and a supported Node LTS version. Keep Prisma CLI and client versions aligned. Use configuration appropriate to the installed versions.

Keep the implementation straightforward. Avoid unnecessary abstraction, extra services, and large dependencies.

**4. Design and navigation**

Create a friendly household app:
- Light mode only.
- Plenty of whitespace.
- Soft neutral backgrounds, white cards, green primary accent.
- Rounded corners and subtle shadows.
- Plain English labels and warm, concise messages.
- Accessible contrast, visible keyboard focus, labelled inputs, and large mobile tap targets.
- Do not communicate category identity through color alone.

Navigation:
- Dashboard.
- Receipts.
- Add receipt.
- Categories.

Desktop: approximately 240px left sidebar and a flexible main area.
Mobile: compact header with an accessible collapsible navigation menu.

Show the page title and an “Add receipt” action where useful. Avoid redundant add buttons on the receipt form itself.

The interface must work at approximately 375px mobile width without horizontal page scrolling. Receipt rows may become cards on mobile.

Display money consistently in EUR using a decimal comma and euro symbol after the amount, for example `12,49 €`. Use readable, unambiguous dates.

Include useful empty states, loading states, success messages, and recoverable error states.

**5. Dashboard**

- Month selector, defaulting to the current month.
- Do not offer future months.
- Main card: total spent in the selected month.
- Small comparison line under the total.
- Spending by category shown as simple horizontal bars, category labels, amounts, and percentages of the selected month’s total.
- Five latest receipts within the selected month, newest receipt date first.
- Receipt links open the edit page.

Comparison rules:
- Current month: compare spending from the first day through today with the same day range of the previous month.
- If the previous month is shorter, cap its range at its last day.
- Completed months: compare the full selected month with the full preceding month.
- Calculate percentage change from those totals.
- Use wording such as “+12% vs same period last month” or “−8% vs previous month”.
- If the comparison total is zero, avoid division by zero: show “No spending in the comparison period”, or “No spending in either period” when both totals are zero.
- Use consistent calendar boundaries in the Europe/Tallinn timezone.

If the selected month has no receipts, show a friendly empty state with an add-receipt action.

**6. Receipts list**

Show:
- Receipt date.
- Store.
- Category with a color indicator.
- Total amount.

Behavior:
- Newest receipt date first, with a deterministic tie-breaker.
- Case-insensitive search by store name.
- Category filter.
- Month filter, including “All months”.
- Default to the current month.
- Search and filters work together.
- Clearly distinguish an empty database from filters with no matching results.
- Click a receipt or its edit action to open its dedicated edit page.
- Delete only after a confirmation dialog.
- Refresh displayed data after successful edits and deletions.

Advanced pagination and sorting controls are not needed for this small demo.

**7. Add and edit receipt pages**

Use dedicated pages, not popup forms.

Fields:
- Store: required, trimmed, nonblank.
- Date: required, defaults to today; today or earlier only.
- Total amount: required, greater than zero, maximum two decimal places.
- Category: required, defaults to “Other” for new receipts.
- Payment method: Card or Cash; defaults to Card.
- Note: optional.

Amount entry:
- Accept both `12,49` and `12.49`.
- Reject invalid numbers and more than two decimal places rather than silently rounding.
- Do not support negative amounts or refunds.
- Use decimal-safe handling or integer cents for calculations; avoid floating-point monetary errors.
- Serialize monetary API values consistently, preferably as decimal strings.

Validation:
- Validate on the server as well as in the form.
- Show clear field-level messages.
- Use sensible length and amount limits consistent with the database schema.
- Preserve entered values when saving fails.
- Disable save actions while a request is pending to prevent accidental duplicate submission.
- Treat receipt dates as calendar dates, without timezone shifts.

Actions:
- “Save receipt” returns to the receipts list and shows “Nice! Receipt saved”.
- Ensure the saved receipt is visible, adjusting the list’s month/filter state if needed.
- On the add page, also offer “Save and add another”. Save successfully, stay on the add page, show confirmation, and reset to the normal new-receipt defaults.
- On the edit page, save updates the existing receipt.
- Include a cancel/back action.

**8. Categories**

Seed these defaults:
- Groceries.
- Household.
- Transport.
- Kids.
- Health.
- Eating out.
- Other.

Show each category’s name and color.

Allow:
- Adding a category.
- Renaming a category.
- Changing its color.
- Deleting a category only when it has no receipts.

Use a preset palette of about eight accessible colors. No free-form color picker.

Reject blank and duplicate names, including names that differ only by case or surrounding whitespace.

Enforce category deletion restrictions in the backend/database, not only in the interface. Return a friendly conflict message if receipts use the category.

Keep “Other” as the guaranteed default: it may change color, but cannot be renamed or deleted. Explain this briefly in the UI. Other categories remain editable.

**9. Backend and data model**

Use Next.js route handlers:
- `GET /api/receipts` with search, category, and month query parameters.
- `POST /api/receipts`.
- `GET /api/receipts/[id]`.
- `PUT /api/receipts/[id]`.
- `DELETE /api/receipts/[id]`.
- `GET /api/stats?month=YYYY-MM`.
- `GET /api/categories`.
- `POST /api/categories`.
- `PUT /api/categories/[id]`.
- `DELETE /api/categories/[id]`.

Prisma models:
- Category: id, name, color, createdAt.
- Receipt: id, store, date, amount as a suitable fixed-precision Decimal, categoryId, paymentMethod enum, optional note, createdAt, updatedAt.
- A minimal internal initialization marker if needed for reliable one-time demo seeding.

Use real foreign keys and restrict deletion of referenced categories. Add only useful indexes.

Validate request bodies, query parameters, dates, category references, and payment-method values. Use appropriate HTTP status codes for invalid input, missing records, conflicts, and database failures.

Do not expose database credentials or raw internal errors to the browser. Log useful sanitized diagnostic details on the server.

When the database is temporarily unavailable at runtime, show a friendly error with a retry action rather than an empty dashboard pretending there is no spending.

Ensure fresh data after mutations and reloads. Do not statically bake database results into the build or cache them indefinitely.

**10. Database initialization and migrations**

Commit the Prisma schema and initial SQL migration.

There is no local development database or shadow database. Generate the initial migration from the schema without connecting to a database, using tooling supported by the chosen Prisma version. Do not use `prisma migrate dev`, destructive resets, or `prisma db push` against Render.

Provide an explicit seed script that:
- Creates the seven default categories.
- Adds exactly ten fictional sample receipts, distributed between the current and previous calendar months.
- Includes some current-month receipts dated today or earlier.
- Gives each sample receipt the note `Sample`.
- Runs safely during startup after migrations.
- Initializes demo data only once, when the application tables are empty.
- Does not recreate deleted samples, overwrite renamed categories, or duplicate data on future starts or deploys.
- Uses a transaction and a persistent initialization marker, or an equally simple robust mechanism.

Do not use “receipt count is zero” alone to decide whether to reseed: deleting all receipts must not make samples reappear.

**11. Build and Render deployment**

Read the runtime database connection from server-side `DATABASE_URL`. Never use a `NEXT_PUBLIC_` variable for credentials.

Provide `.env.example` with a placeholder and comments. Ignore real environment files in Git while allowing `.env.example` to be committed.

`npm run build` must work locally without a live database:
- Generate Prisma Client and run the Next.js production build.
- Do not connect to PostgreSQL, run migrations, or seed during the build.
- If the chosen Prisma tooling requires a syntactically valid URL for generation, use a clearly documented nonsecret build-only placeholder. Never allow it to silently replace a missing runtime DATABASE_URL.

Use:
- Render build command: `npm ci && npm run build`.
- Render start command: `npm start`.

Configure startup to:
1. Apply committed migrations with `prisma migrate deploy`.
2. Run the safe initialization script.
3. Start Next.js listening on `0.0.0.0` and Render’s `PORT`.

Ensure all tools needed by the startup command are available in the deployed environment. If migrations or initialization fail, exit with a useful sanitized log rather than launching a broken application.

Do not depend on a paid pre-deploy command or an interactive Render shell.

Include normal application loading states. The app’s own UI cannot render before the hosting service wakes up; document cold starts instead of claiming the app can display its own initial wake-up screen.

**12. Documentation**

Write a short `README.md` containing:
- What EasyReceipt does.
- Stack.
- Shared-demo behavior and fictional-data notice.
- Main commands.
- Link to DEPLOY.md.
- Manual verification checklist.
- Known limitations and deferred features.

Write concise but exact `DEPLOY.md` instructions for a beginner:
1. Create a Render account and connect GitHub.
2. Create a free Render PostgreSQL database.
3. Create a free Node web service from `easyreceipt-web`, using `main`.
4. Put the database and web service in the same region.
5. Set the web service’s DATABASE_URL to the database’s internal connection URL.
6. Configure the supported Node version, build command, and start command.
7. Enable automatic deployment from main.
8. Explain the first migration and seed run.
9. Explain where to find the public URL and deployment logs.
10. Advise creating the free database only when ready to deploy, because its 30-day free period starts at creation.
11. Give brief troubleshooting for build, migration, connection, and startup failures, reminding me to redact secrets before sharing logs.

Verify current official Render guidance when writing these instructions. Clearly explain:
- Free web services may sleep and take time to wake.
- Free PostgreSQL currently expires after 30 days.
- Data survives normal app redeploys while the same database remains available.
- Keeping the database beyond the free period requires upgrading it.
- Do not promise permanent free storage.

**13. Verification and completion**

No automated test suite is required. Run the production build and any lightweight checks already configured.

Include a manual checklist for me to execute at the deployed URL:
- Open on desktop and mobile.
- Check navigation and narrow-screen layout.
- Confirm sample data and dashboard totals.
- Add amounts with both comma and dot separators.
- Reject blank stores, zero/negative amounts, excess decimals, and future dates.
- Edit a receipt and verify totals update.
- Delete a receipt with confirmation.
- Search and combine filters.
- Test month comparisons, including a zero comparison total.
- Add, rename, recolor, and delete an unused category.
- Confirm a used category cannot be deleted.
- Confirm “Other” remains available.
- Reload and open another browser/device to confirm shared persistence.
- Redeploy and confirm records persist and samples are not duplicated.

Start with a short implementation plan, then do the work. Continue through implementation, successful build, commits, and push unless genuinely blocked.

At the end, report:
- What was implemented.
- Which checks actually passed.
- Commit and push status.
- The exact next steps I must perform in Render.
- Anything still requiring deployed browser verification.

Keep the scope small enough to finish in the available time.