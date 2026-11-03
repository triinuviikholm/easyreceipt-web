"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonClasses } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ErrorState, InlineError, LoadingState, SuccessMessage } from "@/components/states";
import { ApiError, apiFetch, errorMessage } from "@/lib/client";
import { CATEGORY_COLORS, CATEGORY_NAME_MAX, OTHER_CATEGORY } from "@/lib/categories";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

function ColorChoices({ name, value, onChange }: { name: string; value: string; onChange: (color: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">Color</legend>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {CATEGORY_COLORS.map((c) => (
          <label
            key={c.value}
            className={cn(
              "flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border bg-white px-1 py-1.5 text-xs has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary",
              value === c.value ? "border-ink font-semibold" : "border-stone-300",
            )}
          >
            <input type="radio" name={name} value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} className="sr-only" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: c.value }} aria-hidden="true">
              {value === c.value && <Check className="h-3.5 w-3.5 text-white" />}
            </span>
            {c.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CategoryEditor({
  category,
  onSaved,
  onCancel,
}: {
  category: CategoryDTO;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setNameError(undefined);
    if (!category.isDefault && !name.trim()) {
      setNameError("Please enter a category name.");
      return;
    }
    setPending(true);
    try {
      const body = category.isDefault ? { color } : { name: name.trim(), color };
      await apiFetch(`/api/categories/${category.id}`, { method: "PUT", body: JSON.stringify(body) });
      onSaved(`Saved changes to ${category.isDefault ? category.name : name.trim()}.`);
    } catch (err) {
      if (err instanceof ApiError) setNameError(err.fieldErrors?.name);
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="mt-3 space-y-4 rounded-xl bg-stone-50 p-4">
      {error && <InlineError message={error} />}
      <div>
        <Label htmlFor={`name-${category.id}`}>Name</Label>
        <Input
          id={`name-${category.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={CATEGORY_NAME_MAX}
          disabled={category.isDefault}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? `name-${category.id}-error` : category.isDefault ? `name-${category.id}-hint` : undefined}
        />
        {category.isDefault && (
          <p id={`name-${category.id}-hint`} className="mt-1.5 text-sm text-muted">
            The default category keeps its name.
          </p>
        )}
        <FieldError id={`name-${category.id}-error`} message={nameError} />
      </div>
      <ColorChoices name={`color-${category.id}`} value={color} onChange={setColor} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function AddCategory({ onAdded }: { onAdded: (message: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0].value);
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setNameError(undefined);
    if (!name.trim()) {
      setNameError("Please enter a category name.");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/api/categories", { method: "POST", body: JSON.stringify({ name: name.trim(), color }) });
      onAdded(`Added ${name.trim()}.`);
      setName("");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.name) setNameError(err.fieldErrors.name);
      else setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Add a category</h2>
      <form onSubmit={add} noValidate className="mt-4 space-y-4">
        {error && <InlineError message={error} />}
        <div>
          <Label htmlFor="new-category">Name</Label>
          <Input
            id="new-category"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={CATEGORY_NAME_MAX}
            placeholder="e.g. Pets"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "new-category-error" : undefined}
          />
          <FieldError id="new-category-error" message={nameError} />
        </div>
        <ColorChoices name="new-color" value={color} onChange={setColor} />
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {pending ? "Adding…" : "Add category"}
        </Button>
      </form>
    </Card>
  );
}

export function CategoriesView() {
  const [categories, setCategories] = useState<CategoryDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { categories } = await apiFetch<{ categories: CategoryDTO[] }>("/api/categories");
      setCategories(categories);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismissSuccess = useCallback(() => setSuccess(null), []);

  const done = (message: string) => {
    setEditingId(null);
    setActionError(null);
    setSuccess(message);
    load();
  };

  async function remove(category: CategoryDTO) {
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
      setDeleteId(null);
      done(`Deleted ${category.name}.`);
    } catch (err) {
      setDeleteId(null);
      setActionError(errorMessage(err));
      load();
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!categories) return <LoadingState label="Loading categories…" />;

  return (
    <div className="space-y-5">
      {success && <SuccessMessage message={success} onDismiss={dismissSuccess} />}
      {actionError && <InlineError message={actionError} />}

      <Card>
        <h2 className="text-lg font-semibold">Your categories</h2>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          “{OTHER_CATEGORY}” is the default for new receipts. You can change its color, but it can&apos;t be renamed or deleted.
          Other categories can be deleted once no receipts use them.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {categories.map((c) => {
            const blockedReason = c.isDefault
              ? "Default category"
              : c.receiptCount > 0
                ? "In use — can't delete"
                : null;
            return (
              <li key={c.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {c.name}
                      {c.isDefault && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-muted">Default</span>}
                    </p>
                    <p className="text-sm text-muted">
                      {c.receiptCount} {c.receiptCount === 1 ? "receipt" : "receipts"}
                      {blockedReason && !c.isDefault && <span className="sm:hidden"> · {blockedReason}</span>}
                    </p>
                  </div>
                  {blockedReason && !c.isDefault && <span className="hidden text-xs text-muted sm:inline">{blockedReason}</span>}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${c.name}`}
                    aria-expanded={editingId === c.id}
                    onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <AlertDialog open={deleteId === c.id} onOpenChange={(open) => setDeleteId(open ? c.id : null)}>
                    <AlertDialogTrigger
                      className={buttonClasses("ghost", "icon", "text-danger hover:bg-red-50")}
                      aria-label={blockedReason ? `Can't delete ${c.name}: ${blockedReason.toLowerCase()}` : `Delete ${c.name}`}
                      disabled={Boolean(blockedReason)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      title={`Delete ${c.name}?`}
                      description="This category has no receipts. Deleting it can't be undone."
                      confirmLabel="Delete category"
                      pending={deleting}
                      onConfirm={() => remove(c)}
                    />
                  </AlertDialog>
                </div>
                {editingId === c.id && <CategoryEditor category={c} onSaved={done} onCancel={() => setEditingId(null)} />}
              </li>
            );
          })}
        </ul>
      </Card>

      <AddCategory onAdded={done} />
    </div>
  );
}
