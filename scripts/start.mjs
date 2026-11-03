// Production start (Render start command: `npm start`):
//   1. apply committed migrations   2. one-time demo initialization   3. start Next.js
// Any failure stops here with a sanitized log instead of launching a broken app.
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function redact(text) {
  return String(text).replace(/postgres(ql)?:\/\/\S+/gi, "postgresql://***");
}

function fail(message) {
  console.error(`[start] ${redact(message)}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL is not set. Add the Render database's Internal Database URL to this web service's environment.");
}

console.log("[start] Applying database migrations…");
const migrate = spawnSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], {
  stdio: "inherit",
});
if (migrate.status !== 0) {
  fail(`Migrations failed (exit code ${migrate.status ?? migrate.signal}). See the Prisma message above.`);
}

console.log("[start] Checking demo data…");
const seed = spawnSync(process.execPath, ["prisma/seed.mjs"], { stdio: "inherit" });
if (seed.status !== 0) {
  fail(`Initialization failed (exit code ${seed.status ?? seed.signal}).`);
}

const port = process.env.PORT || "3000";
console.log(`[start] Starting EasyReceipt on 0.0.0.0:${port}`);
const next = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
