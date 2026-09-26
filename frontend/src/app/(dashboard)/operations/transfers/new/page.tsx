"use client";

import OperationCreateForm from "@/components/stocksense/OperationCreateForm";

export default function NewTransferPage() {
  return (
    <OperationCreateForm
      operationType="INTERNAL_TRANSFER"
      title="New Internal Transfer"
      backHref="/operations/transfers"
    />
  );
}
