"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
}

interface Location {
  id: string;
  name: string;
  shortCode: string;
  locationType: string;
  warehouseId?: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
}

interface ProductLineItem {
  productId: string;
  demandQty: number;
}

interface OperationCreateFormProps {
  operationType: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT";
  title: string;
  backHref: string;
}

export default function OperationCreateForm({
  operationType,
  title,
  backHref,
}: OperationCreateFormProps) {
  const router = useRouter();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [contactName, setContactName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<ProductLineItem[]>([
    { productId: "", demandQty: 1 },
  ]);

  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load warehouses, locations, products
  useEffect(() => {
    async function loadData() {
      try {
        const [wRes, lRes, pRes] = await Promise.all([
          api.get<{ data: Warehouse[] }>("/warehouses"),
          api.get<{ data: Location[] }>("/locations"),
          api.get<{ data: Product[] }>("/products?pageSize=100"),
        ]);

        setWarehouses(wRes.data || []);
        setLocations(lRes.data || []);
        setProducts(pRes.data || []);

        if (wRes.data?.length > 0) {
          const firstWh = wRes.data[0];
          setSelectedWarehouseId(firstWh.id);

          const whLocs = (lRes.data || []).filter(
            (l) => l.warehouseId === firstWh.id
          );
          const vendorLoc = (lRes.data || []).find((l) => l.locationType === "VENDOR");
          const custLoc = (lRes.data || []).find((l) => l.locationType === "CUSTOMER");
          const defaultInternal = whLocs[0] || (lRes.data || [])[0];

          if (operationType === "RECEIPT") {
            setSourceLocationId(vendorLoc?.id || defaultInternal?.id || "");
            setDestinationLocationId(defaultInternal?.id || "");
          } else if (operationType === "DELIVERY") {
            setSourceLocationId(defaultInternal?.id || "");
            setDestinationLocationId(custLoc?.id || defaultInternal?.id || "");
          } else if (operationType === "INTERNAL_TRANSFER") {
            setSourceLocationId(whLocs[0]?.id || "");
            setDestinationLocationId(whLocs[1]?.id || whLocs[0]?.id || "");
          } else if (operationType === "ADJUSTMENT") {
            setSourceLocationId(defaultInternal?.id || "");
            setDestinationLocationId(defaultInternal?.id || "");
          }
        }
      } catch {
        toast.error("Failed to load reference data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [operationType]);

  // If DELIVERY and source location changes, fetch stock
  useEffect(() => {
    if (operationType === "DELIVERY" && sourceLocationId) {
      api
        .get<{ stock: Array<{ productId: string; onHandQty: number; reservedQty: number }> }>(
          `/stock?locationId=${sourceLocationId}`
        )
        .then((res) => {
          const map: Record<string, number> = {};
          for (const s of res.stock || []) {
            map[s.productId] = Number(s.onHandQty || 0) - Number(s.reservedQty || 0);
          }
          setStockMap(map);
        })
        .catch(() => {});
    }
  }, [operationType, sourceLocationId]);

  const addLine = () => {
    setLines([...lines, { productId: "", demandQty: 1 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof ProductLineItem, value: any) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouseId) {
      toast.error("Please select a warehouse");
      return;
    }
    if (!sourceLocationId || !destinationLocationId) {
      toast.error("Please select both source and destination locations");
      return;
    }

    const validLines = lines.filter((l) => l.productId && l.demandQty > 0);
    if (validLines.length === 0) {
      toast.error("Please add at least one product with quantity > 0");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        operationType,
        warehouseId: selectedWarehouseId,
        sourceLocationId,
        destinationLocationId,
        scheduledDate: new Date(scheduledDate).toISOString(),
        notes: notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          demandQty: Number(l.demandQty),
        })),
      };

      const res = await api.post<{ operation: { id: string; reference: string } }>(
        "/operations",
        payload
      );
      toast.success(`Created operation ${res.operation.reference}`);
      router.push(`/operations/${res.operation.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create operation";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 rounded bg-[#18191D] animate-pulse" />
        <div className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-4">
          <div className="h-12 rounded bg-[#18191D] animate-pulse" />
          <div className="h-24 rounded bg-[#18191D] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="p-2 rounded-full border border-[#212228] bg-[#121316] text-slate-300 hover:text-white hover:bg-[#18191D] transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span className="text-[#DDFF46]">➔</span> {title}
          </h1>
          <p className="text-xs mt-0.5 text-slate-400">
            Fill in the details to initialize a new {operationType.toLowerCase().replace("_", " ")} record
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-6 text-white shadow-xl">
        {/* Core fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Warehouse *
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.shortCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Source Location (From) *
            </label>
            <select
              value={sourceLocationId}
              onChange={(e) => setSourceLocationId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
              required
            >
              <option value="">Select source location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} [{l.shortCode}] ({l.locationType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Destination Location (To) *
            </label>
            <select
              value={destinationLocationId}
              onChange={(e) => setDestinationLocationId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
              required
            >
              <option value="">Select destination location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} [{l.shortCode}] ({l.locationType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Lines */}
        <div className="space-y-3 pt-4 border-t border-[#212228]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Product Lines
            </h3>
            <button
              type="button"
              onClick={addLine}
              className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#18191D] border border-[#212228] text-[#DDFF46] hover:bg-[#1A2204] hover:border-[#DDFF46]/40 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div className="border border-[#212228] rounded-xl overflow-hidden bg-[#0C0D0E]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#212228] bg-[#18191D]">
                  <th className="text-left px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Product
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 w-36">
                    Demand Qty
                  </th>
                  {operationType === "DELIVERY" && (
                    <th className="text-right px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 w-36">
                      Available Stock
                    </th>
                  )}
                  <th className="w-12 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const stock = stockMap[line.productId];
                  const isOutOfStock =
                    operationType === "DELIVERY" &&
                    line.productId &&
                    stock !== undefined &&
                    stock < Number(line.demandQty);

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-[#212228] transition-colors ${
                        isOutOfStock ? "bg-rose-950/20" : "hover:bg-[#18191D]/60"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <select
                          value={line.productId}
                          onChange={(e) => updateLine(idx, "productId", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                          required
                        >
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name} ({p.unitOfMeasure})
                            </option>
                          ))}
                        </select>
                        {isOutOfStock && (
                          <div className="text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> Demand exceeds available free stock ({stock || 0})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={line.demandQty}
                          onChange={(e) =>
                            updateLine(idx, "demandQty", parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#2A2B33] text-right bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors font-mono font-bold"
                          required
                        />
                      </td>
                      {operationType === "DELIVERY" && (
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {line.productId ? (
                            <span className={isOutOfStock ? "text-rose-400 font-bold" : "text-[#DDFF46]"}>
                              {stock ?? 0}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          className="p-1 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Notes / Reference Info (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add any internal instructions or remarks..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#212228]">
          <Link href={backHref} className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-[#2A2B33] hover:bg-[#18191D] transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Save as Draft ➔"}
          </button>
        </div>
      </form>
    </div>
  );
}
