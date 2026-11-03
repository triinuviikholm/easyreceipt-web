"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { CategoryBadge } from "@/components/category-badge";
import { MonthSelect } from "@/components/month-select";
import { apiFetch, errorMessage } from "@/lib/client";
import { formatAmount } from "@/lib/money";
import { formatDate, formatMonth } from "@/lib/dates";
import type { StatsDTO } from "@/lib/types";

export function DashboardView({ initialMonth }: { initialMonth: string }) {
  const [month, setMonth] = useState(initialMonth);
  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    setStats(null);
    try {
      const result = await apiFetch<StatsDTO>(`/api/stats?month=${month}`);
      if (id === requestId.current) setStats(result);
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    }
  }, [month]);

  useEffect(() => {
    load();
    window.history.replaceState(null, "", `/?month=${month}`);
  }, [load, month]);

  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <Label htmlFor="dashboard-month">Month</Label>
        <MonthSelect id="dashboard-month" value={month} onChange={setMonth} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !stats ? (
        <LoadingState label="Adding up your spending…" />
      ) : stats.receiptCount === 0 ? (
        <>
          <TotalCard stats={stats} />
          <EmptyState
            icon={PiggyBank}
            title={`No receipts for ${formatMonth(stats.month)}`}
            text="Once you add a receipt for this month, your totals and categories will appear here."
          >
            <Link href="/receipts/new" className={buttonClasses("primary")}>
              Add receipt
            </Link>
          </EmptyState>
        </>
      ) : (
        <>
          <TotalCard stats={stats} />
          <div className="grid gap-5 lg:grid-cols-2">
            <CategoryBreakdown stats={stats} />
            <LatestReceipts stats={stats} />
          </div>
        </>
      )}
    </div>
  );
}

function TotalCard({ stats }: { stats: StatsDTO }) {
  const change = stats.comparison.changePercent;
  const Icon = change !== null && change > 0 ? TrendingUp : change !== null && change < 0 ? TrendingDown : null;
  return (
    <Card>
      <h2 className="text-sm font-medium text-muted">Total spent in {formatMonth(stats.month)}</h2>
      <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{formatAmount(stats.total)}</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
        {stats.comparison.label}
      </p>
      <p className="mt-1 text-xs text-muted">
        {stats.receiptCount} {stats.receiptCount === 1 ? "receipt" : "receipts"}
      </p>
    </Card>
  );
}

function CategoryBreakdown({ stats }: { stats: StatsDTO }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Spending by category</h2>
      <ul className="mt-4 space-y-4">
        {stats.byCategory.map((c) => (
          <li key={c.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-medium text-ink">
                <CategoryBadge name={c.name} color={c.color} />
              </span>
              <span className="shrink-0 text-sm tabular-nums">
                <span className="font-semibold">{formatAmount(c.total)}</span>
                <span className="ml-2 text-muted">{c.percent}%</span>
              </span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-stone-100" aria-hidden="true">
              <div className="h-full rounded-full" style={{ width: `${Math.max(c.percent, 1)}%`, backgroundColor: c.color }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LatestReceipts({ stats }: { stats: StatsDTO }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Latest receipts</h2>
        <Link href={`/receipts?month=${stats.month}`} className="rounded-lg text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="mt-3 -mx-2 divide-y divide-line">
        {stats.latest.map((r) => (
          <li key={r.id}>
            <Link href={`/receipts/${r.id}/edit`} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-stone-50">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.store}</span>
                <span className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                  {formatDate(r.date)}
                  <span aria-hidden="true">·</span>
                  <CategoryBadge name={r.category.name} color={r.category.color} />
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatAmount(r.amount)}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
