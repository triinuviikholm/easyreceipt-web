import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleServerError, jsonError } from "@/lib/api";
import { currentMonth, isValidMonth, isoToDbDate, monthRange, todayIso } from "@/lib/dates";
import { centsToDecimalString, decimalStringToCents } from "@/lib/money";
import { receiptOrder, toReceiptDTO } from "@/lib/receipts";
import { comparisonLabel, comparisonPlan } from "@/lib/stats";
import type { StatsDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

async function sumCents(from: string, to: string) {
  const result = await prisma.receipt.aggregate({
    _sum: { amount: true },
    where: { date: { gte: isoToDbDate(from), lte: isoToDbDate(to) } },
  });
  return result._sum.amount ? decimalStringToCents(result._sum.amount.toFixed(2)) : 0;
}

// GET /api/stats?month=YYYY-MM (defaults to the current month in Europe/Tallinn)
export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? currentMonth();
  if (!isValidMonth(month)) return jsonError(400, "Month must look like YYYY-MM.");
  if (month > currentMonth()) return jsonError(400, "Future months aren't available.");

  try {
    const range = monthRange(month);
    const plan = comparisonPlan(month, todayIso());

    const [groups, receiptCount, latest, currentCents, previousCents] = await Promise.all([
      prisma.receipt.groupBy({ by: ["categoryId"], where: { date: range }, _sum: { amount: true } }),
      prisma.receipt.count({ where: { date: range } }),
      prisma.receipt.findMany({ where: { date: range }, include: { category: true }, orderBy: receiptOrder, take: 5 }),
      sumCents(plan.current.from, plan.current.to),
      sumCents(plan.previous.from, plan.previous.to),
    ]);

    const categories = await prisma.category.findMany({ where: { id: { in: groups.map((g) => g.categoryId) } } });
    const byId = new Map(categories.map((c) => [c.id, c]));
    const rows = groups.map((g) => ({
      category: byId.get(g.categoryId)!,
      cents: g._sum.amount ? decimalStringToCents(g._sum.amount.toFixed(2)) : 0,
    }));
    const totalCents = rows.reduce((sum, r) => sum + r.cents, 0);

    const body: StatsDTO = {
      month,
      total: centsToDecimalString(totalCents),
      receiptCount,
      comparison: {
        kind: plan.kind,
        previousTotal: centsToDecimalString(previousCents),
        ...comparisonLabel(plan.kind, currentCents, previousCents),
      },
      byCategory: rows
        .filter((r) => r.category)
        .sort((a, b) => b.cents - a.cents || a.category.name.localeCompare(b.category.name))
        .map((r) => ({
          id: r.category.id,
          name: r.category.name,
          color: r.category.color,
          total: centsToDecimalString(r.cents),
          percent: totalCents > 0 ? Math.round((r.cents * 100) / totalCents) : 0,
        })),
      latest: latest.map(toReceiptDTO),
    };
    return NextResponse.json(body);
  } catch (err) {
    return handleServerError("GET /api/stats", err);
  }
}
