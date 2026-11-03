"use client";

import { Select } from "@/components/ui/input";
import { formatMonth, recentMonths } from "@/lib/dates";

// Current month and the 23 before it (never future months). A selected month outside
// that window (e.g. from a link) is still listed so the control shows the truth.
export function MonthSelect({
  id,
  value,
  onChange,
  includeAll = false,
}: {
  id: string;
  value: string;
  onChange: (month: string) => void;
  includeAll?: boolean;
}) {
  const months = recentMonths();
  if (value !== "all" && !months.includes(value)) months.push(value);

  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll && <option value="all">All months</option>}
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonth(m)}
        </option>
      ))}
    </Select>
  );
}
