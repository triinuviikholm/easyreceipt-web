import type { Category, Receipt } from "@prisma/client";
import { prisma } from "./prisma";
import { parseAmount, centsToDecimalString } from "./money";
import { MIN_DATE, dbDateToIso, isValidIsoDate, isoToDbDate, todayIso } from "./dates";
import type { PaymentMethod, ReceiptDTO } from "./types";

export const STORE_MAX = 100;
export const NOTE_MAX = 500;
export const CATEGORY_GONE = "That category no longer exists. Please choose another one.";

export function toReceiptDTO(r: Receipt & { category: Category }): ReceiptDTO {
  return {
    id: r.id,
    store: r.store,
    date: dbDateToIso(r.date),
    amount: r.amount.toFixed(2),
    paymentMethod: r.paymentMethod,
    note: r.note,
    category: { id: r.category.id, name: r.category.name, color: r.category.color },
  };
}

// Newest receipt date first; createdAt and id make the order deterministic.
export const receiptOrder = [{ date: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];

export type ReceiptInput = {
  store: string;
  date: Date;
  amount: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  note: string | null;
};

export type ValidationResult = { ok: true; data: ReceiptInput } | { ok: false; fieldErrors: Record<string, string> };

// Validates a receipt request body, including that the category exists.
export async function validateReceipt(body: Record<string, unknown>): Promise<ValidationResult> {
  const fieldErrors: Record<string, string> = {};

  const store = typeof body.store === "string" ? body.store.trim() : "";
  if (!store) fieldErrors.store = "Please enter the store name.";
  else if (store.length > STORE_MAX) fieldErrors.store = `Store name can be at most ${STORE_MAX} characters.`;

  const date = body.date;
  if (!isValidIsoDate(date)) fieldErrors.date = "Please choose a valid date.";
  else if (date > todayIso()) fieldErrors.date = "The date can't be in the future.";
  else if (date < MIN_DATE) fieldErrors.date = "Please choose a date from 2000 or later.";

  const amount = parseAmount(body.amount);
  if (!amount.ok) fieldErrors.amount = amount.error;

  const paymentMethod = body.paymentMethod ?? "CARD";
  if (paymentMethod !== "CARD" && paymentMethod !== "CASH") fieldErrors.paymentMethod = "Choose Card or Cash.";

  let note: string | null = null;
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== "string") fieldErrors.note = "Note must be text.";
    else {
      note = body.note.trim() || null;
      if (note && note.length > NOTE_MAX) fieldErrors.note = `Note can be at most ${NOTE_MAX} characters.`;
    }
  }

  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  if (!categoryId) fieldErrors.categoryId = "Please choose a category.";
  else if (!(await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
    fieldErrors.categoryId = CATEGORY_GONE;
  }

  if (Object.keys(fieldErrors).length > 0 || !amount.ok) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: {
      store,
      date: isoToDbDate(date as string),
      amount: centsToDecimalString(amount.cents),
      categoryId,
      paymentMethod: paymentMethod as PaymentMethod,
      note,
    },
  };
}
