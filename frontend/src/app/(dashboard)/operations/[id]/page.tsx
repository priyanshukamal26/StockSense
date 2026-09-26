"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/stocksense/StatusBadge";
import { formatDate, getOperationTypeLabel } from "@/lib/utils";
import { ArrowLeft, Printer, CheckCircle, Clock, AlertTriangle, XCircle, Play } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface OperationLine {
  id: string;
  productId: string;
  demandQty: number;
  doneQty: number;
  product: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
    costPrice?: number;
  };
}

interface Operation {
  id: string;
  reference: string;
  operationType: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT";
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";
  scheduledDate: string;
  isLate: boolean;
  notes?: string;
  sourceLocation: { id: string; name: string; shortCode: string; warehouse?: { name: string } | null };
  destinationLocation: { id: string; name: string; shortCode: string; warehouse?: { name: string } | null };
  contact?: { id: string; name: string; email?: string; phone?: string; address?: string } | null;
  responsible: { id: string; loginId: string; fullName: string };
  lines: OperationLine[];
}

interface StockAvailability {
  productId: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

export default function OperationDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = Array.isArray(routeParams.id) ? routeParams.id[0] : (routeParams.id as string);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [stockMap, setStockMap] = useState<Record<string, StockAvailability>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchOperation = useCallback(async () => {
    try {
      const res = await api.get<{ operation: Operation }>(`/operations/${id}`);
      setOperation(res.operation);

      // If DELIVERY or INTERNAL_TRANSFER, fetch stock at source location to detect shortage
      if (res.operation.sourceLocation?.id) {
        try {
          const stockRes = await api.get<{ stock: Array<{ productId: string; onHandQty: number; reservedQty: number }> }>(
            `/stock?locationId=${res.operation.sourceLocation.id}`
          );
          const map: Record<string, StockAvailability> = {};
          for (const item of stockRes.stock || []) {
            const onHand = Number(item.onHandQty || 0);
            const reserved = Number(item.reservedQty || 0);
            map[item.productId] = {
              productId: item.productId,
              onHand,
              reserved,
              freeToUse: onHand - reserved,
            };
          }
          setStockMap(map);
        } catch {
          // Non-blocking stock check
        }
      }
    } catch {
      toast.error("Failed to load operation details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOperation();
  }, [fetchOperation]);

  const handleMarkTodo = async () => {
    if (!operation) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ operation: Operation }>(`/operations/${operation.id}/mark-todo`);
      setOperation(res.operation);
      toast.success(`Operation status updated to ${res.operation.status}`);
      fetchOperation();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to mark as To Do";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!operation) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ operation: Operation }>(`/operations/${operation.id}/validate`);
      setOperation(res.operation);
      toast.success("Operation validated successfully. Stock ledger updated.");
      fetchOperation();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to validate operation";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!operation || !confirm("Are you sure you want to cancel this operation?")) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ operation: Operation }>(`/operations/${operation.id}/cancel`);
      setOperation(res.operation);
      toast.info("Operation cancelled.");
      fetchOperation();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel operation";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="ss-card space-y-4">
          <div className="skeleton h-6 w-1/3 rounded" />
          <div className="skeleton h-24 rounded" />
        </div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-lg font-medium text-gray-700">Operation not found</p>
        <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Stepper steps definition
  const steps =
    operation.operationType === "DELIVERY"
      ? ["DRAFT", "WAITING", "READY", "DONE"]
      : operation.operationType === "ADJUSTMENT"
      ? ["DRAFT", "DONE"]
      : ["DRAFT", "READY", "DONE"];

  const currentStepIdx = steps.indexOf(operation.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in print:m-0 print:p-0">
      {/* Top action header (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border hover:bg-gray-100 transition-colors"
            style={{ borderColor: "var(--muted-2)" }}
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-mono">
                {operation.reference}
              </h1>
              <StatusBadge status={operation.status} />
              {operation.isLate && operation.status !== "DONE" && operation.status !== "CANCELLED" && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-red-100 text-red-700 border border-red-200">
                  Late
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-3)" }}>
              {getOperationTypeLabel(operation.operationType)} · Scheduled for {formatDate(operation.scheduledDate)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {operation.status === "DRAFT" && (
            <>
              <button
                onClick={handleMarkTodo}
                disabled={actionLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Play size={16} /> Mark as To Do
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle size={16} /> Cancel
              </button>
            </>
          )}

          {operation.status === "WAITING" && (
            <>
              <button
                onClick={handleMarkTodo}
                disabled={actionLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Clock size={16} /> Re-check Availability
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle size={16} /> Cancel
              </button>
            </>
          )}

          {operation.status === "READY" && (
            <>
              <button
                onClick={handleValidate}
                disabled={actionLoading}
                className="btn-primary flex items-center gap-2"
                style={{ background: "#10B981" }}
              >
                <CheckCircle size={16} /> Validate
              </button>
              <button
                onClick={handlePrint}
                className="btn-outline flex items-center gap-2"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle size={16} /> Cancel
              </button>
            </>
          )}

          {operation.status === "DONE" && (
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer size={16} /> Print Receipt (A4)
            </button>
          )}
        </div>
      </div>

      {/* Out of stock warning banner if in WAITING status */}
      {operation.status === "WAITING" && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Waiting on stock availability</h4>
            <p className="text-xs text-amber-800 mt-1">
              One or more items in this operation currently exceed available stock at source location{" "}
              <strong>{operation.sourceLocation.name}</strong>. Out-of-stock items are highlighted in red below.
            </p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="ss-card space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Status Stepper */}
        <div className="flex items-center justify-between border-b pb-6 print:hidden" style={{ borderColor: "var(--muted-2)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider" style={{ color: "var(--muted-3)" }}>
              Workflow Stage:
            </span>
          </div>
          <div className="flex items-center gap-3">
            {steps.map((st, i) => {
              const isPast = currentStepIdx >= i;
              const isCurrent = operation.status === st;
              return (
                <div key={st} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className="w-8 h-0.5 rounded"
                      style={{ background: isPast ? "var(--brand-primary)" : "var(--muted-2)" }}
                    />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                        : isPast
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operation Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
              {operation.operationType === "RECEIPT"
                ? "Receive From (Vendor)"
                : operation.operationType === "DELIVERY"
                ? "Delivery Address (Customer)"
                : "Contact"}
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {operation.contact?.name || "—"}
            </p>
            {operation.contact?.address && (
              <p className="text-xs text-gray-500 mt-0.5">{operation.contact.address}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
              From (Source Location)
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {operation.sourceLocation.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Code: {operation.sourceLocation.shortCode}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
              To (Destination Location)
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {operation.destinationLocation.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Code: {operation.destinationLocation.shortCode}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
              Responsible
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {operation.responsible.fullName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">@{operation.responsible.loginId}</p>
          </div>
        </div>

        {/* Products Lines Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Products</h3>
            <span className="text-xs text-gray-500">
              {operation.lines.length} item{operation.lines.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--muted-2)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--muted-2)", background: "var(--muted-1)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    SKU
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Demand Qty
                  </th>
                  {operation.operationType === "DELIVERY" && (
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Available In Stock
                    </th>
                  )}
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Done Qty
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {operation.lines.map((line) => {
                  const stock = stockMap[line.productId];
                  const isOutOfStock =
                    operation.operationType === "DELIVERY" &&
                    stock !== undefined &&
                    stock.freeToUse < Number(line.demandQty);

                  return (
                    <tr
                      key={line.id}
                      className={`border-b transition-colors ${
                        isOutOfStock
                          ? "bg-red-50/80 border-red-200 text-red-900"
                          : "hover:bg-gray-50 text-gray-800"
                      }`}
                      style={{ borderColor: isOutOfStock ? "#FECACA" : "var(--muted-2)" }}
                    >
                      <td className="px-4 py-3 font-medium">
                        <span className="text-gray-900">{line.product.name}</span>
                        {isOutOfStock && (
                          <div className="text-xs text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={12} /> Out of Stock ({stock ? stock.freeToUse : 0} available)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {line.product.sku}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {Number(line.demandQty)} {line.product.unitOfMeasure}
                      </td>
                      {operation.operationType === "DELIVERY" && (
                        <td className="px-4 py-3 text-right font-medium">
                          {stock ? (
                            <span className={isOutOfStock ? "text-red-700 font-bold" : "text-emerald-700"}>
                              {stock.freeToUse} {line.product.unitOfMeasure}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-semibold">
                        {operation.status === "DONE" ? Number(line.doneQty) : 0} {line.product.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {operation.status === "DONE" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle size={12} /> Received
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <XCircle size={12} /> Insufficient Stock
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable slip footer (only visible when printed) */}
        <div className="hidden print:block pt-16 border-t mt-16 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="font-semibold text-gray-900">Authorized Signature:</p>
              <div className="border-b border-gray-400 mt-12 w-48" />
              <p className="text-xs text-gray-500 mt-1">StockSense Warehouse Team</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Received / Inspected By:</p>
              <div className="border-b border-gray-400 mt-12 w-48" />
              <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
