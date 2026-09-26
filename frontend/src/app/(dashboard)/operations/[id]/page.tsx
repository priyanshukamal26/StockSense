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
        <div className="h-8 w-48 rounded-lg bg-[#18191D] animate-pulse" />
        <div className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-4">
          <div className="h-6 w-1/3 rounded bg-[#18191D] animate-pulse" />
          <div className="h-24 rounded bg-[#18191D] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="text-center py-20 space-y-4 rounded-2xl border border-[#212228] bg-[#121316]">
        <p className="text-lg font-medium text-slate-300">Operation not found</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors">
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
            className="p-2 rounded-full border border-[#212228] bg-[#121316] text-slate-300 hover:text-white hover:bg-[#18191D] transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                {operation.reference}
              </h1>
              <StatusBadge status={operation.status} />
              {operation.isLate && operation.status !== "DONE" && operation.status !== "CANCELLED" && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Late
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 text-slate-400">
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
                className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm"
              >
                <Play size={14} /> Mark as To Do
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
              >
                <XCircle size={14} /> Cancel
              </button>
            </>
          )}

          {operation.status === "WAITING" && (
            <>
              <button
                onClick={handleMarkTodo}
                disabled={actionLoading}
                className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm"
              >
                <Clock size={14} /> Re-check Availability
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
              >
                <XCircle size={14} /> Cancel
              </button>
            </>
          )}

          {operation.status === "READY" && (
            <>
              <button
                onClick={handleValidate}
                disabled={actionLoading}
                className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm"
              >
                <CheckCircle size={14} /> Validate Operation
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white border border-[#2A2B33] bg-[#121316] hover:bg-[#18191D] transition-colors flex items-center gap-2"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
              >
                <XCircle size={14} /> Cancel
              </button>
            </>
          )}

          {operation.status === "DONE" && (
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer size={14} /> Print Receipt (A4)
            </button>
          )}
        </div>
      </div>

      {/* Out of stock warning banner if in WAITING status */}
      {operation.status === "WAITING" && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 text-amber-200 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-amber-200">Waiting on stock availability</h4>
            <p className="text-xs text-amber-300/80 mt-1">
              One or more items in this operation currently exceed available stock at source location{" "}
              <strong className="text-amber-100">{operation.sourceLocation.name}</strong>. Out-of-stock items are highlighted in red below.
            </p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Status Stepper */}
        <div className="flex items-center justify-between border-b border-[#212228] pb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-mono font-semibold tracking-wider text-slate-400">
              Workflow Stage:
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-[#0C0D0E] border border-[#212228] p-1.5 rounded-full">
            {steps.map((st, i) => {
              const isPast = currentStepIdx > i;
              const isCurrent = operation.status === st;
              return (
                <div key={st} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className="w-4 md:w-6 h-0.5 rounded-full"
                      style={{ background: isPast ? "#DDFF46" : "#212228" }}
                    />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                      isCurrent
                        ? "bg-[#DDFF46] text-black shadow-sm"
                        : isPast
                        ? "bg-[#1A2204] text-[#DDFF46] border border-[#DDFF46]/30"
                        : "bg-[#18191D] text-slate-500"
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
          <div className="p-3.5 rounded-xl border border-[#212228] bg-[#0C0D0E]/60">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              {operation.operationType === "RECEIPT"
                ? "Receive From (Vendor)"
                : operation.operationType === "DELIVERY"
                ? "Delivery Address (Customer)"
                : "Contact"}
            </p>
            <p className="text-sm font-semibold text-white mt-1">
              {operation.contact?.name || "—"}
            </p>
            {operation.contact?.address && (
              <p className="text-xs text-slate-400 mt-0.5">{operation.contact.address}</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-[#212228] bg-[#0C0D0E]/60">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              From (Source Location)
            </p>
            <p className="text-sm font-semibold text-white mt-1">
              {operation.sourceLocation.name}
            </p>
            <p className="text-xs font-mono text-[#DDFF46] mt-0.5">
              Code: {operation.sourceLocation.shortCode}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#212228] bg-[#0C0D0E]/60">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              To (Destination Location)
            </p>
            <p className="text-sm font-semibold text-white mt-1">
              {operation.destinationLocation.name}
            </p>
            <p className="text-xs font-mono text-[#DDFF46] mt-0.5">
              Code: {operation.destinationLocation.shortCode}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#212228] bg-[#0C0D0E]/60">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Responsible
            </p>
            <p className="text-sm font-semibold text-white mt-1">
              {operation.responsible.fullName}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">@{operation.responsible.loginId}</p>
          </div>
        </div>

        {/* Products Lines Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Line Items</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#18191D] border border-[#212228] text-slate-400">
              {operation.lines.length} item{operation.lines.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="border border-[#212228] rounded-xl overflow-hidden bg-[#0C0D0E]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#212228] bg-[#18191D]">
                  <th className="text-left px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                    SKU
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Demand Qty
                  </th>
                  {operation.operationType === "DELIVERY" && (
                    <th className="text-right px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Available In Stock
                    </th>
                  )}
                  <th className="text-right px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Done Qty
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
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
                      className={`border-b border-[#212228] transition-colors ${
                        isOutOfStock
                          ? "bg-rose-950/20 text-rose-200"
                          : "hover:bg-[#18191D]/60 text-slate-200"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <span className="text-white font-semibold">{line.product.name}</span>
                        {isOutOfStock && (
                          <div className="text-xs text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={12} /> Out of Stock ({stock ? stock.freeToUse : 0} available)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#DDFF46]">
                        {line.product.sku}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {Number(line.demandQty)} {line.product.unitOfMeasure}
                      </td>
                      {operation.operationType === "DELIVERY" && (
                        <td className="px-4 py-3 text-right font-medium">
                          {stock ? (
                            <span className={isOutOfStock ? "text-rose-400 font-bold" : "text-[#DDFF46]"}>
                              {stock.freeToUse} {line.product.unitOfMeasure}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                        {operation.status === "DONE" ? Number(line.doneQty) : 0} {line.product.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {operation.status === "DONE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            <CheckCircle size={12} /> Validated
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                            <XCircle size={12} /> Insufficient Stock
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-slate-500">Pending</span>
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
              <p className="text-xs text-gray-500 mt-1">StockSense Operations</p>
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
