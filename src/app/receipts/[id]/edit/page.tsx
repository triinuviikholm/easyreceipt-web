import { PageHeader } from "@/components/page-header";
import { ReceiptForm } from "@/components/receipt-form";

export const metadata = { title: "Edit receipt · EasyReceipt" };

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit receipt" />
      <ReceiptForm key={id} receiptId={id} />
    </div>
  );
}
