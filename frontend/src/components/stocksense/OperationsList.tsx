"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/stocksense/StatusBadge";
import { formatDate, getOperationTypeLabel } from "@/lib/utils";
import Link from "next/link";
import { Plus, Search, AlertCircle, ArrowRight } from "lucide-react";

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
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{title}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/70 text-[10px] font-mono border border-white/10 font-bold">
              {total} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50">
            Real-time queue tracking and double-entry validation for {title.toLowerCase()}
          </p>
        </div>
        <Link
          href={newHref}
          className="bg-[#DDFF46] hover:bg-[#cbf033] text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all flex items-center gap-2 flex-shrink-0 shadow-lg shadow-[#DDFF46]/20 hover:scale-[1.02]"
        >
          <Plus size={16} />
          <span>New {title.replace(/s$/, "")}</span>
          <span>→</span>
        </Link>
      </div>

      {/* Filters (LaunchDarkly Pill Search & Select) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by reference, contact, or location…"
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-[#141519] border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#DDFF46] transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 text-xs sm:text-sm rounded-full bg-[#141519] border border-white/10 text-white/80 outline-none focus:border-[#DDFF46] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="WAITING">Waiting</option>
          <option value="READY">Ready</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table Card (LaunchDarkly Dark High-Contrast Table) */}
      <div className="bg-[#141519] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#101114]">
                {["Reference", "Scheduled Date", "From", "To", "Contact", "Responsible", "Lines", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3.5 font-bold font-mono text-[11px] uppercase tracking-wider text-white/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 text-white/40">
                        <AlertCircle size={22} />
                      </div>
                      <p className="text-sm font-bold text-white">No operations found</p>
                      <p className="text-xs text-white/40">
                        {search || status ? "Try adjusting your search query or status filter" : `Create your first ${title.replace(/s$/, "").toLowerCase()}`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                operations.map((op) => (
                  <tr
                    key={op.id}
                    className="hover:bg-white/[0.04] transition-colors"
                    style={{
                      background: op.isLate && op.status !== "DONE" && op.status !== "CANCELLED"
                        ? "rgba(220,38,38,0.05)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/operations/${op.id}`}
                        className="font-mono font-bold text-sm text-[#DDFF46] hover:underline inline-flex items-center gap-1"
                      >
                        {op.reference}
                      </Link>
                      {op.isLate && op.status !== "DONE" && op.status !== "CANCELLED" && (
                        <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                          Late
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-white/60 font-mono text-xs">
                      {formatDate(op.scheduledDate)}
                    </td>
                    <td className="px-4 py-3.5 text-white/80 font-medium">
                      {op.sourceLocation.name}
                    </td>
                    <td className="px-4 py-3.5 text-white/80 font-medium">
                      {op.destinationLocation.name}
                    </td>
                    <td className="px-4 py-3.5 text-white/60">
                      {op.contact?.name ?? <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-white/70">
                      {op.responsible.fullName}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-white/80">
                      {op._count.lines}
                    </td>
                    <td className="px-4 py-3.5">
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
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-white/10 bg-[#101114]">
            <p className="text-xs text-white/40 font-mono">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} operations
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all font-mono"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all font-mono"
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
