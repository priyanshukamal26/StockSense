"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/stocksense/StatusBadge";
import { formatDate, getOperationTypeLabel } from "@/lib/utils";
import Link from "next/link";
import { Plus, Search, AlertCircle } from "lucide-react";

interface OperationType {
  type: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT";
  label: string;
  href: string;
}

interface Operation {
  id: string;
  reference: string;
  operationType: string;
  status: string;
  scheduledDate: string;
  isLate: boolean;
  sourceLocation: { name: string; warehouse?: { name: string } | null };
  destinationLocation: { name: string; warehouse?: { name: string } | null };
  contact?: { name: string } | null;
  responsible: { fullName: string };
  _count: { lines: number };
}

interface OperationsListProps {
  operationType: OperationType["type"];
  title: string;
  newHref: string;
}

export default function OperationsListPage({
  operationType,
  title,
  newHref,
}: OperationsListProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchOps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: operationType,
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      const res = await api.get<{ data: Operation[]; meta: { total: number } }>(
        `/operations?${params}`
      );
      setOperations(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [operationType, page, search, status]);

  useEffect(() => {
    fetchOps();
  }, [fetchOps]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-3)" }}>
            {total} operation{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href={newHref} className="btn-primary flex-shrink-0">
          <Plus size={16} />
          New {title.replace(/s$/, "")}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-3)" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by reference or contact…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-all"
            style={{ borderColor: "var(--muted-2)", background: "white" }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{ borderColor: "var(--muted-2)", background: "white", color: "var(--muted-4)" }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="WAITING">Waiting</option>
          <option value="READY">Ready</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="ss-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--muted-2)", background: "var(--muted-1)" }}>
                {["Reference", "Scheduled Date", "From", "To", "Contact", "Responsible", "Lines", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide"
                    style={{ color: "var(--muted-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--muted-2)" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--muted-2)" }}>
                        <AlertCircle size={24} style={{ color: "var(--muted-3)" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--muted-4)" }}>No operations found</p>
                      <p className="text-xs" style={{ color: "var(--muted-3)" }}>
                        {search || status ? "Try adjusting your filters" : `Create your first ${title.replace(/s$/, "").toLowerCase()}`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                operations.map((op) => (
                  <tr
                    key={op.id}
                    className="border-b transition-colors hover:bg-gray-50"
                    style={{
                      borderColor: "var(--muted-2)",
                      background: op.isLate && op.status !== "DONE" && op.status !== "CANCELLED"
                        ? "rgba(220,38,38,0.02)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/operations/${op.id}`} className="font-mono font-semibold text-sm hover:underline"
                        style={{ color: "var(--brand-primary)" }}>
                        {op.reference}
                      </Link>
                      {op.isLate && op.status !== "DONE" && op.status !== "CANCELLED" && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
                          Late
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-4)" }}>
                      {formatDate(op.scheduledDate)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-4)" }}>
                      {op.sourceLocation.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-4)" }}>
                      {op.destinationLocation.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-4)" }}>
                      {op.contact?.name ?? <span style={{ color: "var(--muted-3)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-4)" }}>
                      {op.responsible.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: "var(--muted-4)" }}>
                      {op._count.lines}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={op.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--muted-2)" }}>
            <p className="text-xs" style={{ color: "var(--muted-3)" }}>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--muted-2)" }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--muted-2)" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
