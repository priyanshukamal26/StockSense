"use client";

import OperationsListPage from "@/components/stocksense/OperationsList";

export default function ReceiptsPage() {
  return (
    <OperationsListPage
      operationType="RECEIPT"
      title="Receipts"
      newHref="/operations/receipts/new"
    />
  );
}
