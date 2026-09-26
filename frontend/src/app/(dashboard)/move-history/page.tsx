"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Search, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Activity, Database } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface StockMove {
  id: string;
  movedAt: string;
  quantity: number;
  product: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
  fromLocation: {
    id: string;
    name: string;
    shortCode: string;
    locationType: string;
  };
  toLocation: {
    id: string;
    name: string;
    shortCode: string;
    locationType: string;
  };
  operation: {
    id: string;
    reference: string;
    operationType: string;
    contact?: { id: string; name: string } | null;
  };
  createdBy: {
    id: string;
    fullName: string;
  };
}

export default function MoveHistoryPage() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchMoves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
      });

      const res = await api.get<{ data: StockMove[]; meta: { total: number } }>(
        `/move-history?${params}`
      );
      setMoves(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch {
      toast.error("Failed to load move history");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  const totalPages = Math.ceil(total / pageSize);

  // Helper to determine Move Direction for exact green/red coloring per docs/02 §10
  const getMoveDirection = (m: StockMove) => {
    if (m.operation.operationType === "RECEIPT") return "IN";
    if (m.operation.operationType === "DELIVERY") return "OUT";

    const toIsInternal = m.toLocation.locationType === "INTERNAL";
    const fromIsInternal = m.fromLocation.locationType === "INTERNAL";

    if (toIsInternal && !fromIsInternal) return "IN";
    if (fromIsInternal && !toIsInternal) return "OUT";
    return "INTERNAL";
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">Move History</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#DDFF46]/10 text-[#DDFF46] text-[10px] font-mono border border-[#DDFF46]/20 font-bold uppercase">
              Audit Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50">
            Append-only double-entry ledger verifying every inventory mutation across warehouses
          </p>
        </div>

        {/* Invariant Status Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-[#141519] border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-mono">
            <Database size={13} className="text-[#DDFF46]" />
            <span className="text-white/60">Immutable Ledger:</span>
            <span className="font-bold text-[#DDFF46]">{total} Entries</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by operation reference or contact..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-[#141519] border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#DDFF46] transition-all"
          />
        </div>
      </div>

      {/* Ledger Table (LaunchDarkly High-Contrast Dark Table) */}
      <div className="bg-[#141519] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#101114]">
                <th className="text-left px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  Reference
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  Date
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  Contact
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  From (Credit)
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  To (Debit)
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  Product SKU
                </th>
                <th className="text-right px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  Quantity
                </th>
                <th className="text-center px-5 py-3.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white/40">
                  State
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : moves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-white/40 text-sm">
                    No moves recorded yet. Moves appear here automatically once operations are validated.
                  </td>
                </tr>
              ) : (
                moves.map((m) => {
                  const dir = getMoveDirection(m);
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/operations/${m.operation.id}`}
                          className="font-mono font-bold text-xs text-[#DDFF46] hover:underline"
                        >
                          {m.operation.reference}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/60 font-mono">
                        {formatDate(m.movedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/80">
                        {m.operation.contact?.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/70">
                        {m.fromLocation.name}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/70">
                        {m.toLocation.name}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-xs text-white">
                        {m.product.name}
                        <span className="text-white/40 font-mono text-[10px] block">
                          [{m.product.sku}]
                        </span>
                      </td>
                      {/* Quantity column: IN moves in green, OUT moves in red per docs/02 §10 */}
                      <td className="px-5 py-3.5 text-right font-bold font-mono text-sm">
                        {dir === "IN" ? (
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                            <ArrowDownLeft size={12} /> +{Number(m.quantity)} {m.product.unitOfMeasure}
                          </span>
                        ) : dir === "OUT" ? (
                          <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                            <ArrowUpRight size={12} /> -{Number(m.quantity)} {m.product.unitOfMeasure}
                          </span>
                        ) : (
                          <span className="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                            <ArrowLeftRight size={12} /> {Number(m.quantity)} {m.product.unitOfMeasure}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Committed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-[#101114]">
            <p className="text-xs text-white/40 font-mono">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} records
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
