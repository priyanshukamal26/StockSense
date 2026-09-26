"use client";

import OperationsListPage from "@/components/stocksense/OperationsList";

export default function DeliveriesPage() {
  return (
    <OperationsListPage
      operationType="DELIVERY"
      title="Deliveries"
      newHref="/operations/deliveries/new"
    />
  );
}
