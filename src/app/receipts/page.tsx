import { PageHeader } from "@/components/page-header";
import { ReceiptsView } from "./receipts-view";
import { currentMonth, isValidMonth } from "@/lib/dates";

export const metadata = { title: "Receipts · EasyReceipt" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReceiptsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "");
  const month = one("month");

  return (
    <>
      <PageHeader title="Receipts" showAdd />
      <ReceiptsView
        initialSearch={one("search")}
        initialCategory={one("category")}
        initialMonth={month === "all" || isValidMonth(month) ? month : currentMonth()}
        saved={one("saved") === "1"}
      />
    </>
  );
}
