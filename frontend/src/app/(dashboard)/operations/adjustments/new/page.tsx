"use client";

import OperationCreateForm from "@/components/stocksense/OperationCreateForm";

export default function NewAdjustmentPage() {
  return (
    <OperationCreateForm
      operationType="ADJUSTMENT"
      title="New Stock Adjustment"
      backHref="/operations/adjustments"
    />
  );
}
