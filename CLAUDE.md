# CLAUDE.md

## Deployment

- This web app runs on Render, not on the local computer.
- Render deploys automatically from the `main` branch of this GitHub repo (https://github.com/triinuviikholm/easyreceipt-web).

## Database

- The database is a Render PostgreSQL database.
- It is available only through the `DATABASE_URL` environment variable on Render.

## Do not

- Do not set up a local database.
- Do not set up or run a local server.

## Workflow

- Before every push, run `npm run build` to make sure the app builds. Do not push if the build fails.
- After each finished task, commit and push to GitHub (`main`) so that Render deploys the new version.
