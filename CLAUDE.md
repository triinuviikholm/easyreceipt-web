# CLAUDE.md

## Deployment

- This web app runs on Railway, not on the local computer.
- Railway deploys automatically from the `main` branch of this GitHub repo (https://github.com/triinuviikholm/easyreceipt-web).

## Database

- The database is a Railway PostgreSQL database.
- It is available only through the `DATABASE_URL` environment variable on Railway.

## Do not

- Do not set up a local database.
- Do not set up or run a local server.

## Workflow

- Before every push, run `npm run build` to make sure the app builds. Do not push if the build fails.
- After each finished task, commit and push to GitHub (`main`) so that Railway deploys the new version.
