import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleServerError, isForeignKeyViolation, isNotFound, isUniqueViolation, jsonError, readJson } from "@/lib/api";
import { DUPLICATE_NAME, toCategoryDTO, validateCategory } from "@/lib/category-server";
import { OTHER_CATEGORY, isOther } from "@/lib/categories";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "We couldn't find that category. It may have been deleted.";
const IN_USE = "This category is used by receipts, so it can't be deleted. Move those receipts to another category first.";

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await readJson(request);
  if (!body) return jsonError(400, "The request body must be a JSON object.");

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return jsonError(404, NOT_FOUND);

    const result = await validateCategory(body, { requireName: false, requireColor: false, excludeId: id });
    if (!result.ok) return jsonError(result.status, result.error, result.fieldErrors);
    if (isOther(existing.name) && result.name !== undefined && result.name !== existing.name) {
      const message = `"${OTHER_CATEGORY}" is the default category. You can change its color, but not its name.`;
      return jsonError(409, message, { name: message });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: result.name, color: result.color },
      include: { _count: { select: { receipts: true } } },
    });
    return NextResponse.json({ category: toCategoryDTO(category) });
  } catch (err) {
    if (isNotFound(err)) return jsonError(404, NOT_FOUND);
    if (isUniqueViolation(err)) return jsonError(409, DUPLICATE_NAME, { name: DUPLICATE_NAME });
    return handleServerError("PUT /api/categories/[id]", err);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const existing = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { receipts: true } } } });
    if (!existing) return jsonError(404, NOT_FOUND);
    if (isOther(existing.name)) return jsonError(409, `"${OTHER_CATEGORY}" is the default category and can't be deleted.`);
    if (existing._count.receipts > 0) return jsonError(409, IN_USE);

    // The database foreign key (ON DELETE RESTRICT) also blocks this if a receipt
    // was added in the meantime.
    await prisma.category.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (isNotFound(err)) return jsonError(404, NOT_FOUND);
    if (isForeignKeyViolation(err)) return jsonError(409, IN_USE);
    return handleServerError("DELETE /api/categories/[id]", err);
  }
}
