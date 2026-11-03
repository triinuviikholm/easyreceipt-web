import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Card className="text-center">
      <h1 className="text-xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have been moved or deleted.</p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Back to dashboard
      </Link>
    </Card>
  );
}
