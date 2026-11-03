import { PageHeader } from "@/components/page-header";
import { DashboardView } from "./dashboard-view";
import { currentMonth, isValidMonth } from "@/lib/dates";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { month } = await searchParams;
  const current = currentMonth();
  const initialMonth = typeof month === "string" && isValidMonth(month) && month <= current ? month : current;

  return (
    <>
      <PageHeader title="Dashboard" description="Your household spending at a glance." showAdd />
      <DashboardView initialMonth={initialMonth} />
    </>
  );
}
