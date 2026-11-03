import { daysInMonth, shiftMonth } from "./dates";

export type ComparisonPlan = {
  kind: "same-period" | "previous-month";
  current: { from: string; to: string }; // inclusive ISO dates
  previous: { from: string; to: string };
};

const day = (month: string, d: number) => `${month}-${String(d).padStart(2, "0")}`;

// Current month: day 1..today vs the same days of last month (capped at its last day).
// Completed months: the full month vs the full preceding month.
export function comparisonPlan(month: string, today: string): ComparisonPlan {
  const prev = shiftMonth(month, -1);
  if (month === today.slice(0, 7)) {
    const todayDay = Number(today.slice(8, 10));
    return {
      kind: "same-period",
      current: { from: day(month, 1), to: today },
      previous: { from: day(prev, 1), to: day(prev, Math.min(todayDay, daysInMonth(prev))) },
    };
  }
  return {
    kind: "previous-month",
    current: { from: day(month, 1), to: day(month, daysInMonth(month)) },
    previous: { from: day(prev, 1), to: day(prev, daysInMonth(prev)) },
  };
}

export function comparisonLabel(kind: ComparisonPlan["kind"], currentCents: number, previousCents: number) {
  if (previousCents === 0) {
    return {
      changePercent: null,
      label: currentCents === 0 ? "No spending in either period" : "No spending in the comparison period",
    };
  }
  const changePercent = Math.round(((currentCents - previousCents) * 100) / previousCents);
  const sign = changePercent > 0 ? "+" : changePercent < 0 ? "−" : "±";
  const suffix = kind === "same-period" ? "vs same period last month" : "vs previous month";
  return { changePercent, label: `${sign}${Math.abs(changePercent)}% ${suffix}` };
}
