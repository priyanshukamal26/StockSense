"use client";

import OperationCreateForm from "@/components/stocksense/OperationCreateForm";

export default function NewDeliveryPage() {
  return (
    <OperationCreateForm
      operationType="DELIVERY"
      title="New Delivery Order"
      backHref="/operations/deliveries"
    />
  );
}
