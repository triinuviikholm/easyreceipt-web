"use client";

import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Loader2, RotateCw, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Card className="flex items-center justify-center gap-3 py-12 text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {label}
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center" role="alert">
      <AlertCircle className="h-8 w-8 text-danger" aria-hidden="true" />
      <div>
        <p className="font-medium">Sorry, that didn&apos;t load.</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="text-lg font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted">{text}</p>
      {children && <div className="mt-2">{children}</div>}
    </Card>
  );
}

// Inline success message that hides itself after a few seconds.
export function SuccessMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-green-100"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
