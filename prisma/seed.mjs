// One-time demo initialization. Runs on every start (after `prisma migrate deploy`)
// but only creates sample data once: a persistent "demo-seeded" marker in AppMeta
// records that it happened, so deleting receipts or renaming categories later never
// brings samples back. Can also be run manually with `npm run seed`.
import { PrismaClient } from "@prisma/client";

const SEED_MARKER = "demo-seeded";
const OTHER = { name: "Other", color: "#475569" };

const DEFAULT_CATEGORIES = [
  { name: "Groceries", color: "#15803d" },
  { name: "Household", color: "#1d4ed8" },
  { name: "Transport", color: "#a16207" },
  { name: "Kids", color: "#be185d" },
  { name: "Health", color: "#0f766e" },
  { name: "Eating out", color: "#c2410c" },
  OTHER,
];

// Today's calendar date in Europe/Tallinn as { y, m, d } (m is 1-12).
function tallinnToday() {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return { y, m, d };
}

function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Calendar dates are stored as UTC midnight in a DATE column.
function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

function sampleReceipts() {
  const today = tallinnToday();
  const prev = today.m === 1 ? { y: today.y - 1, m: 12 } : { y: today.y, m: today.m - 1 };
  const prevLast = daysInMonth(prev.y, prev.m);
  const cur = (daysAgo) => utcDate(today.y, today.m, Math.max(1, today.d - daysAgo));
  const old = (day) => utcDate(prev.y, prev.m, Math.min(day, prevLast));

  return [
    { store: "Fresh Market", date: cur(0), amount: "42.18", category: "Groceries", paymentMethod: "CARD" },
    { store: "City Bus", date: cur(1), amount: "3.00", category: "Transport", paymentMethod: "CARD" },
    { store: "Corner Café", date: cur(2), amount: "11.40", category: "Eating out", paymentMethod: "CASH" },
    { store: "Home & Garden", date: cur(4), amount: "27.95", category: "Household", paymentMethod: "CARD" },
    { store: "Green Pharmacy", date: cur(6), amount: "8.49", category: "Health", paymentMethod: "CARD" },
    { store: "Fresh Market", date: old(4), amount: "56.30", category: "Groceries", paymentMethod: "CARD" },
    { store: "Toy Corner", date: old(9), amount: "19.99", category: "Kids", paymentMethod: "CARD" },
    { store: "Pizza Place", date: old(14), amount: "24.50", category: "Eating out", paymentMethod: "CASH" },
    { store: "Fuel Station", date: old(20), amount: "48.70", category: "Transport", paymentMethod: "CARD" },
    { store: "Post Office", date: old(26), amount: "6.25", category: "Other", paymentMethod: "CASH" },
  ];
}

function redact(text) {
  return String(text).replace(/postgres(ql)?:\/\/\S+/gi, "postgresql://***");
}

async function seed() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Serialize concurrent starts (e.g. overlapping deploys).
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(724001)`;

        let created = false;
        const marker = await tx.appMeta.findUnique({ where: { key: SEED_MARKER } });
        if (!marker) {
          // Only add demo data to a truly fresh database.
          if ((await tx.category.count()) === 0 && (await tx.receipt.count()) === 0) {
            await tx.category.createMany({ data: DEFAULT_CATEGORIES });
            const categories = await tx.category.findMany();
            const idByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));
            await tx.receipt.createMany({
              data: sampleReceipts().map(({ category, ...r }) => ({ ...r, categoryId: idByName[category], note: "Sample" })),
            });
            created = true;
          }
          await tx.appMeta.create({ data: { key: SEED_MARKER, value: new Date().toISOString() } });
        }

        // "Other" is the guaranteed default category.
        const other = await tx.category.findFirst({ where: { name: { equals: OTHER.name, mode: "insensitive" } } });
        if (!other) await tx.category.create({ data: OTHER });

        return created;
      },
      { timeout: 30_000, maxWait: 30_000 },
    );
    console.log(result ? "[seed] Demo data created (7 categories, 10 sample receipts)." : "[seed] Already initialized — nothing to do.");
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error("[seed] Initialization failed:", err?.code ?? err?.name ?? "Error", redact(err?.message ?? err));
  process.exit(1);
});
