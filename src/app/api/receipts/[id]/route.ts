import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleServerError, isForeignKeyViolation, isNotFound, jsonError, readJson } from "@/lib/api";
import { CATEGORY_GONE, toReceiptDTO, validateReceipt } from "@/lib/receipts";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "We couldn't find that receipt. It may have been deleted.";

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const receipt = await prisma.receipt.findUnique({ where: { id }, include: { category: true } });
    if (!receipt) return jsonError(404, NOT_FOUND);
    return NextResponse.json({ receipt: toReceiptDTO(receipt) });
  } catch (err) {
    return handleServerError("GET /api/receipts/[id]", err);
  }
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await readJson(request);
  if (!body) return jsonError(400, "The request body must be a JSON object.");

  try {
    const result = await validateReceipt(body);
    if (!result.ok) return jsonError(422, "Please check the highlighted fields.", result.fieldErrors);
    const receipt = await prisma.receipt.update({ where: { id }, data: result.data, include: { category: true } });
    return NextResponse.json({ receipt: toReceiptDTO(receipt) });
  } catch (err) {
    if (isNotFound(err)) return jsonError(404, NOT_FOUND);
    if (isForeignKeyViolation(err)) return jsonError(422, CATEGORY_GONE, { categoryId: CATEGORY_GONE });
    return handleServerError("PUT /api/receipts/[id]", err);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await prisma.receipt.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (isNotFound(err)) return jsonError(404, NOT_FOUND);
    return handleServerError("DELETE /api/receipts/[id]", err);
  }
}
