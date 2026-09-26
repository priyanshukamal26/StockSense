"use client";

import OperationsListPage from "@/components/stocksense/OperationsList";

export default function TransfersPage() {
  return (
    <OperationsListPage
      operationType="INTERNAL_TRANSFER"
      title="Internal Transfers"
      newHref="/operations/transfers/new"
    />
  );
}
