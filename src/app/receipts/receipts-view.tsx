"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, ReceiptText, SearchX, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, InlineError, LoadingState, SuccessMessage } from "@/components/states";
import { CategoryBadge } from "@/components/category-badge";
import { MonthSelect } from "@/components/month-select";
import { apiFetch, errorMessage } from "@/lib/client";
import { formatAmount } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import type { CategoryDTO, ReceiptDTO } from "@/lib/types";

type ListData = { receipts: ReceiptDTO[]; totalCount: number };

export function ReceiptsView({
  initialSearch,
  initialCategory,
  initialMonth,
  saved,
}: {
  initialSearch: string;
  initialCategory: string;
  initialMonth: string;
  saved: boolean;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [month, setMonth] = useState(initialMonth);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [data, setData] = useState<ListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(saved ? "Nice! Receipt saved" : null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    const params = new URLSearchParams({ month });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);
    try {
      const result = await apiFetch<ListData>(`/api/receipts?${params}`);
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    }
  }, [debouncedSearch, category, month]);

  useEffect(() => {
    load();
    // Keep the URL in sync so filters survive reloads and can be shared.
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);
    window.history.replaceState(null, "", `/receipts?${params}`);
  }, [load, month, debouncedSearch, category]);

  useEffect(() => {
    apiFetch<{ categories: CategoryDTO[] }>("/api/categories")
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, []);

  const dismissSuccess = useCallback(() => setSuccess(null), []);

  async function deleteReceipt(receipt: ReceiptDTO) {
    setDeletingId(receipt.id);
    setActionError(null);
    try {
      await apiFetch(`/api/receipts/${receipt.id}`, { method: "DELETE" });
      setOpenDialog(null);
      setSuccess(`Receipt from ${receipt.store} deleted.`);
      await load();
    } catch (err) {
      setOpenDialog(null);
      setActionError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const filtersActive = Boolean(debouncedSearch || category || month !== "all");

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setMonth("all");
  }

  return (
    <div>
      {success && <SuccessMessage message={success} onDismiss={dismissSuccess} />}
      {actionError && <InlineError message={actionError} />}

      <Card className="mb-5 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="search">Search store</Label>
          <Input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. market"
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="category-filter">Category</Label>
          <Select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="month-filter">Month</Label>
          <MonthSelect id="month-filter" value={month} onChange={setMonth} includeAll />
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <LoadingState label="Loading receipts…" />
      ) : data.totalCount === 0 ? (
        <EmptyState icon={ReceiptText} title="No receipts yet" text="Add your first receipt and it will show up here.">
          <Link href="/receipts/new" className={buttonClasses("primary")}>
            Add receipt
          </Link>
        </EmptyState>
      ) : data.receipts.length === 0 ? (
        <EmptyState icon={SearchX} title="No matching receipts" text="Nothing matches these filters. Try another search, category or month.">
          {filtersActive && (
            <Button variant="secondary" onClick={clearFilters}>
              Show all receipts
            </Button>
          )}
        </EmptyState>
      ) : (
        <Card className="p-0 sm:p-0">
          <div className="hidden grid-cols-[8rem_1fr_10rem_7rem_6rem] gap-4 border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted sm:grid">
            <span>Date</span>
            <span>Store</span>
            <span>Category</span>
            <span className="text-right">Total</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul className="divide-y divide-line">
            {data.receipts.map((r) => (
              <li key={r.id} className="flex items-center gap-2 px-3 py-2 sm:grid sm:grid-cols-[1fr_6rem] sm:gap-4 sm:px-2">
                <Link
                  href={`/receipts/${r.id}/edit`}
                  className="min-w-0 flex-1 rounded-xl px-2 py-2 hover:bg-stone-50 sm:grid sm:grid-cols-[8rem_1fr_10rem_7rem] sm:items-center sm:gap-4 sm:px-3"
                >
                  <span className="flex items-baseline justify-between gap-3 sm:contents">
                    <span className="truncate font-medium sm:order-2">{r.store}</span>
                    <span className="shrink-0 font-semibold tabular-nums sm:order-4 sm:text-right">{formatAmount(r.amount)}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-sm text-muted sm:contents">
                    <span className="sm:order-1">{formatDate(r.date)}</span>
                    <span aria-hidden="true" className="sm:hidden">
                      ·
                    </span>
                    <span className="min-w-0 sm:order-3">
                      <CategoryBadge name={r.category.name} color={r.category.color} />
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 justify-end gap-1">
                  <Link
                    href={`/receipts/${r.id}/edit`}
                    className={buttonClasses("ghost", "icon", "hidden sm:inline-flex")}
                    aria-label={`Edit receipt from ${r.store}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <AlertDialog open={openDialog === r.id} onOpenChange={(open) => setOpenDialog(open ? r.id : null)}>
                    <AlertDialogTrigger className={buttonClasses("ghost", "icon", "text-danger hover:bg-red-50")} aria-label={`Delete receipt from ${r.store}`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      title="Delete this receipt?"
                      description={`${r.store}, ${formatDate(r.date)}, ${formatAmount(r.amount)}. This can't be undone.`}
                      confirmLabel="Delete receipt"
                      pending={deletingId === r.id}
                      onConfirm={() => deleteReceipt(r)}
                    />
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
