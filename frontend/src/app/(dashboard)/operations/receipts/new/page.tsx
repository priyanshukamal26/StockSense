"use client";

import OperationCreateForm from "@/components/stocksense/OperationCreateForm";

export default function NewReceiptPage() {
  return (
    <OperationCreateForm
      operationType="RECEIPT"
      title="New Receipt"
      backHref="/operations/receipts"
    />
  );
}
