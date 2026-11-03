import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleServerError, isForeignKeyViolation, jsonError, readJson } from "@/lib/api";
import { isValidMonth, monthRange } from "@/lib/dates";
import { CATEGORY_GONE, receiptOrder, toReceiptDTO, validateReceipt } from "@/lib/receipts";

export const dynamic = "force-dynamic";

// GET /api/receipts?search=&category=<id>&month=YYYY-MM|all
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = (params.get("search") ?? "").trim();
  const category = params.get("category") ?? "";
  const month = params.get("month") ?? "all";

  if (search.length > 100) return jsonError(400, "Search text is too long.");
  if (month !== "all" && !isValidMonth(month)) return jsonError(400, "Month must look like YYYY-MM.");

  const where: Prisma.ReceiptWhereInput = {};
  if (search) where.store = { contains: search, mode: "insensitive" };
  if (category) where.categoryId = category;
  if (month !== "all") where.date = monthRange(month);

  try {
    const [receipts, totalCount] = await Promise.all([
      prisma.receipt.findMany({ where, include: { category: true }, orderBy: receiptOrder, take: 500 }),
      prisma.receipt.count(),
    ]);
    // totalCount lets the UI tell "no receipts at all" apart from "no matches".
    return NextResponse.json({ receipts: receipts.map(toReceiptDTO), totalCount });
  } catch (err) {
    return handleServerError("GET /api/receipts", err);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError(400, "The request body must be a JSON object.");

  try {
    const result = await validateReceipt(body);
    if (!result.ok) return jsonError(422, "Please check the highlighted fields.", result.fieldErrors);
    const receipt = await prisma.receipt.create({ data: result.data, include: { category: true } });
    return NextResponse.json({ receipt: toReceiptDTO(receipt) }, { status: 201 });
  } catch (err) {
    if (isForeignKeyViolation(err)) return jsonError(422, CATEGORY_GONE, { categoryId: CATEGORY_GONE });
    return handleServerError("POST /api/receipts", err);
  }
}
