// Money is handled as integer cents in calculations and as decimal strings ("12.49")
// in the API, so no floating-point arithmetic touches monetary values.

export const MAX_AMOUNT_CENTS = 99_999_999; // 999 999,99 € — fits DECIMAL(10,2)

export type AmountParse = { ok: true; cents: number } | { ok: false; error: string };

// Accepts "12,49", "12.49", "12" (surrounding spaces ignored).
export function parseAmount(input: unknown): AmountParse {
  const text = typeof input === "string" ? input.trim() : typeof input === "number" ? String(input) : "";
  if (text === "") return { ok: false, error: "Please enter the total amount." };
  if (text.startsWith("-")) return { ok: false, error: "The amount must be greater than zero." };
  const match = /^(\d+)(?:[.,](\d*))?$/.exec(text);
  if (!match) return { ok: false, error: "Please enter a number, for example 12,49." };
  const [, whole, fraction = ""] = match;
  if (fraction.length > 2) return { ok: false, error: "Use at most two decimal places." };
  if (whole.length > 9) return { ok: false, error: "That amount is too large." };
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0) return { ok: false, error: "The amount must be greater than zero." };
  if (cents > MAX_AMOUNT_CENTS) return { ok: false, error: "The amount can be at most 999 999,99 €." };
  return { ok: true, cents };
}

export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

// "12.49" (or a Prisma Decimal's toString) -> 1249
export function decimalStringToCents(value: string | { toString(): string }): number {
  const text = value.toString();
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -cents : cents;
}

// 1249 -> "12,49 €"; 123456 -> "1 234,56 €" (non-breaking spaces)
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  const whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${whole},${String(abs % 100).padStart(2, "0")} €`;
}

export function formatAmount(decimal: string): string {
  return formatCents(decimalStringToCents(decimal));
}

// "12.49" -> "12,49" for editing in the form
export function decimalToInput(decimal: string): string {
  return decimal.replace(".", ",");
}
