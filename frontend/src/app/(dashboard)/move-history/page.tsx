"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Search, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Move History</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-3)" }}>
            Complete append-only audit ledger of every inventory mutation across warehouses
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 border text-gray-600 font-medium">
          Total Moves: <strong className="text-gray-900">{total}</strong>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by operation reference or contact..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none bg-white"
            style={{ borderColor: "var(--muted-2)" }}
          />
        </div>
      </div>

      {/* Ledger Table per wireframe columns */}
      <div className="ss-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--muted-2)", background: "var(--muted-1)" }}
              >
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Reference
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Date
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Contact
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  From
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  To
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Product
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Quantity
                </th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--muted-2)" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 w-20 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : moves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-500 text-sm">
                    No moves recorded yet. Moves appear here once operations are validated.
                  </td>
                </tr>
              ) : (
                moves.map((m) => {
                  const dir = getMoveDirection(m);
                  return (
                    <tr
                      key={m.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "var(--muted-2)" }}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/operations/${m.operation.id}`}
                          className="font-mono font-semibold text-xs hover:underline text-blue-600"
                        >
                          {m.operation.reference}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {formatDate(m.movedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-800">
                        {m.operation.contact?.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-700">
                        {m.fromLocation.name}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-700">
                        {m.toLocation.name}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-xs text-gray-900">
                        {m.product.name}
                        <span className="text-gray-400 font-mono text-[11px] block">
                          [{m.product.sku}]
                        </span>
                      </td>
                      {/* Quantity column: IN moves in green, OUT moves in red per docs/02 §10 */}
                      <td className="px-5 py-3.5 text-right font-bold font-mono text-sm">
                        {dir === "IN" ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <ArrowDownLeft size={13} /> +{Number(m.quantity)} {m.product.unitOfMeasure}
                          </span>
                        ) : dir === "OUT" ? (
                          <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <ArrowUpRight size={13} /> -{Number(m.quantity)} {m.product.unitOfMeasure}
                          </span>
                        ) : (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <ArrowLeftRight size={13} /> {Number(m.quantity)} {m.product.unitOfMeasure}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          Done
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
          <div
            className="flex items-center justify-between px-5 py-3.5 border-t"
            style={{ borderColor: "var(--muted-2)" }}
          >
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 hover:bg-gray-50"
                style={{ borderColor: "var(--muted-2)" }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 hover:bg-gray-50"
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
