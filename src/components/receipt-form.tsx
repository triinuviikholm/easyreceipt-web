"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonClasses } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { ErrorState, InlineError, LoadingState, SuccessMessage } from "@/components/states";
import { ApiError, apiFetch, errorMessage } from "@/lib/client";
import { parseAmount, decimalToInput } from "@/lib/money";
import { MIN_DATE, isValidIsoDate, todayIso } from "@/lib/dates";
import type { CategoryDTO, PaymentMethod, ReceiptDTO } from "@/lib/types";

const STORE_MAX = 100;
const NOTE_MAX = 500;

type Values = {
  store: string;
  date: string;
  amount: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  note: string;
};

type Errors = Partial<Record<keyof Values, string>>;

function defaults(categories: CategoryDTO[]): Values {
  const other = categories.find((c) => c.isDefault) ?? categories[0];
  return { store: "", date: todayIso(), amount: "", categoryId: other?.id ?? "", paymentMethod: "CARD", note: "" };
}

function validate(v: Values): Errors {
  const errors: Errors = {};
  const store = v.store.trim();
  if (!store) errors.store = "Please enter the store name.";
  else if (store.length > STORE_MAX) errors.store = `Store name can be at most ${STORE_MAX} characters.`;
  if (!isValidIsoDate(v.date)) errors.date = "Please choose a valid date.";
  else if (v.date > todayIso()) errors.date = "The date can't be in the future.";
  else if (v.date < MIN_DATE) errors.date = "Please choose a date from 2000 or later.";
  const amount = parseAmount(v.amount);
  if (!amount.ok) errors.amount = amount.error;
  if (!v.categoryId) errors.categoryId = "Please choose a category.";
  if (v.note.trim().length > NOTE_MAX) errors.note = `Note can be at most ${NOTE_MAX} characters.`;
  return errors;
}

export function ReceiptForm({ receiptId }: { receiptId?: string }) {
  const isEdit = Boolean(receiptId);
  const router = useRouter();
  const storeRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryDTO[] | null>(null);
  const [values, setValues] = useState<Values | null>(null);
  const [loadError, setLoadError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setValues(null);
    try {
      const [{ categories }, receiptData] = await Promise.all([
        apiFetch<{ categories: CategoryDTO[] }>("/api/categories"),
        receiptId ? apiFetch<{ receipt: ReceiptDTO }>(`/api/receipts/${receiptId}`) : Promise.resolve(null),
      ]);
      setCategories(categories);
      if (receiptData) {
        const r = receiptData.receipt;
        setValues({
          store: r.store,
          date: r.date,
          amount: decimalToInput(r.amount),
          categoryId: r.category.id,
          paymentMethod: r.paymentMethod,
          note: r.note ?? "",
        });
      } else {
        setValues(defaults(categories));
      }
    } catch (err) {
      setLoadError({ message: errorMessage(err), notFound: err instanceof ApiError && err.status === 404 });
    }
  }, [receiptId]);

  useEffect(() => {
    load();
  }, [load]);

  const dismissSuccess = useCallback(() => setSuccess(null), []);

  if (loadError) {
    if (loadError.notFound) {
      return (
        <Card className="text-center">
          <p className="font-medium">{loadError.message}</p>
          <Link href="/receipts" className={buttonClasses("primary", "md", "mt-4")}>
            Back to receipts
          </Link>
        </Card>
      );
    }
    return <ErrorState message={loadError.message} onRetry={load} />;
  }
  if (!values || !categories) return <LoadingState label={isEdit ? "Loading receipt…" : "Getting the form ready…"} />;

  const set = (field: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues({ ...values, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !values) return;
    const addAnother = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "another";
    setFormError(null);
    setSuccess(null);

    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setFormError("Please check the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const body = JSON.stringify({ ...values, store: values.store.trim(), note: values.note.trim() || null });
      const { receipt } = await apiFetch<{ receipt: ReceiptDTO }>(isEdit ? `/api/receipts/${receiptId}` : "/api/receipts", {
        method: isEdit ? "PUT" : "POST",
        body,
      });
      if (addAnother) {
        setValues(defaults(categories!));
        setErrors({});
        setSuccess(`Nice! Receipt saved — ${receipt.store} added. Ready for the next one.`);
        setPending(false);
        storeRef.current?.focus();
      } else {
        // Open the list on the receipt's month with no other filters, so it is visible.
        router.push(`/receipts?month=${receipt.date.slice(0, 7)}&saved=1`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors as Errors);
      setFormError(errorMessage(err));
      setPending(false);
    }
  }

  const describedBy = (field: keyof Values) => (errors[field] ? `${field}-error` : undefined);

  return (
    <Card>
      {success && <SuccessMessage message={success} onDismiss={dismissSuccess} />}
      {formError && <InlineError message={formError} />}

      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="store">Store</Label>
          <Input
            id="store"
            ref={storeRef}
            value={values.store}
            onChange={set("store")}
            maxLength={STORE_MAX}
            autoComplete="off"
            placeholder="e.g. Fresh Market"
            required
            aria-invalid={Boolean(errors.store)}
            aria-describedby={describedBy("store")}
          />
          <FieldError id="store-error" message={errors.store} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={values.date}
              onChange={set("date")}
              min={MIN_DATE}
              max={todayIso()}
              required
              aria-invalid={Boolean(errors.date)}
              aria-describedby={describedBy("date")}
            />
            <FieldError id="date-error" message={errors.date} />
          </div>
          <div>
            <Label htmlFor="amount">Total amount (€)</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={values.amount}
              onChange={set("amount")}
              placeholder="12,49"
              autoComplete="off"
              required
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={describedBy("amount") ?? "amount-hint"}
            />
            {errors.amount ? (
              <FieldError id="amount-error" message={errors.amount} />
            ) : (
              <p id="amount-hint" className="mt-1.5 text-sm text-muted">
                Use a comma or a dot, e.g. 12,49 or 12.49.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={values.categoryId}
              onChange={set("categoryId")}
              required
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={describedBy("categoryId")}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError id="categoryId-error" message={errors.categoryId} />
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium">Payment method</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["CARD", "CASH"] as const).map((method) => (
                <label
                  key={method}
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={values.paymentMethod === method}
                    onChange={set("paymentMethod")}
                    className="sr-only"
                  />
                  {method === "CARD" ? "Card" : "Cash"}
                </label>
              ))}
            </div>
            <FieldError id="paymentMethod-error" message={errors.paymentMethod} />
          </fieldset>
        </div>

        <div>
          <Label htmlFor="note">
            Note <span className="font-normal text-muted">(optional)</span>
          </Label>
          <Textarea
            id="note"
            value={values.note}
            onChange={set("note")}
            maxLength={NOTE_MAX}
            aria-invalid={Boolean(errors.note)}
            aria-describedby={describedBy("note")}
          />
          <FieldError id="note-error" message={errors.note} />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
          <Link href="/receipts" className={buttonClasses("ghost", "md", "sm:mr-auto")}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Link>
          {!isEdit && (
            <Button type="submit" value="another" variant="secondary" disabled={pending}>
              {pending ? "Saving…" : "Save and add another"}
            </Button>
          )}
          <Button type="submit" value="save" disabled={pending}>
            {pending ? "Saving…" : "Save receipt"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
