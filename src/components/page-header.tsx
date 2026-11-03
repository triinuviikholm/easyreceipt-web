import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  showAdd = false,
}: {
  title: string;
  description?: string;
  showAdd?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {showAdd && (
        <Link href="/receipts/new" className={buttonClasses("primary")}>
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add receipt
        </Link>
      )}
    </div>
  );
}
