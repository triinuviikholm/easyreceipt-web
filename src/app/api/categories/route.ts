import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleServerError, isUniqueViolation, jsonError, readJson } from "@/lib/api";
import { toCategoryDTO, validateCategory, DUPLICATE_NAME } from "@/lib/category-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { receipts: true } } },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ categories: categories.map(toCategoryDTO) });
  } catch (err) {
    return handleServerError("GET /api/categories", err);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError(400, "The request body must be a JSON object.");

  try {
    const result = await validateCategory(body, { requireName: true, requireColor: true });
    if (!result.ok) return jsonError(result.status, result.error, result.fieldErrors);
    const category = await prisma.category.create({
      data: { name: result.name!, color: result.color! },
      include: { _count: { select: { receipts: true } } },
    });
    return NextResponse.json({ category: toCategoryDTO(category) }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) return jsonError(409, DUPLICATE_NAME, { name: DUPLICATE_NAME });
    return handleServerError("POST /api/categories", err);
  }
}
