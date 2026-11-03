import { PageHeader } from "@/components/page-header";
import { ReceiptForm } from "@/components/receipt-form";

export const metadata = { title: "Add receipt · EasyReceipt" };

export default function NewReceiptPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add receipt" description="Record what you spent. It only takes a moment." />
      <ReceiptForm />
    </div>
  );
}
