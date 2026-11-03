import type { Category } from "@prisma/client";
import { prisma } from "./prisma";
import { CATEGORY_NAME_MAX, isOther, isPaletteColor } from "./categories";
import type { CategoryDTO } from "./types";

export const DUPLICATE_NAME = "A category with this name already exists.";

export function toCategoryDTO(c: Category & { _count: { receipts: number } }): CategoryDTO {
  return { id: c.id, name: c.name, color: c.color, receiptCount: c._count.receipts, isDefault: isOther(c.name) };
}

type Result =
  | { ok: true; name?: string; color?: string }
  | { ok: false; status: number; error: string; fieldErrors: Record<string, string> };

// Validates name/color. Names are trimmed and compared case-insensitively.
export async function validateCategory(
  body: Record<string, unknown>,
  opts: { requireName: boolean; requireColor: boolean; excludeId?: string },
): Promise<Result> {
  const fieldErrors: Record<string, string> = {};
  let name: string | undefined;
  let color: string | undefined;

  if (body.name !== undefined || opts.requireName) {
    name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    if (!name) fieldErrors.name = "Please enter a category name.";
    else if (name.length > CATEGORY_NAME_MAX) fieldErrors.name = `Name can be at most ${CATEGORY_NAME_MAX} characters.`;
  }
  if (body.color !== undefined || opts.requireColor) {
    if (!isPaletteColor(body.color)) fieldErrors.color = "Please choose one of the colors.";
    else color = body.color;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 422, error: "Please check the highlighted fields.", fieldErrors };
  }

  if (name) {
    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}) },
      select: { id: true },
    });
    if (duplicate) return { ok: false, status: 409, error: DUPLICATE_NAME, fieldErrors: { name: DUPLICATE_NAME } };
  }
  return { ok: true, name, color };
}
