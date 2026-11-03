// Category is always shown as text plus a color dot, never by color alone.
export function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="truncate">{name}</span>
    </span>
  );
}
