import { PageHeader } from "@/components/page-header";
import { CategoriesView } from "./categories-view";

export const metadata = { title: "Categories · EasyReceipt" };

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Categories" description="Group your receipts the way your household thinks about spending." />
      <CategoriesView />
    </div>
  );
}
