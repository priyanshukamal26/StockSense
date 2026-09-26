"use client";

import OperationsListPage from "@/components/stocksense/OperationsList";

export default function AdjustmentsPage() {
  return (
    <OperationsListPage
      operationType="ADJUSTMENT"
      title="Stock Adjustments"
      newHref="/operations/adjustments/new"
    />
  );
}
