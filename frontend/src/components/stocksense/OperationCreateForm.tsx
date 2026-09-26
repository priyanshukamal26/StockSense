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
        <div className="skeleton h-8 w-48 rounded" />
        <div className="ss-card space-y-4">
          <div className="skeleton h-12 rounded" />
          <div className="skeleton h-24 rounded" />
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
          className="p-2 rounded-lg border hover:bg-gray-100 transition-colors"
          style={{ borderColor: "var(--muted-2)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-3)" }}>
            Fill in the details to create a new {operationType.toLowerCase().replace("_", " ")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ss-card space-y-6">
        {/* Core fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Warehouse *
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
              style={{ borderColor: "var(--muted-2)" }}
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
              style={{ borderColor: "var(--muted-2)" }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Source Location (From) *
            </label>
            <select
              value={sourceLocationId}
              onChange={(e) => setSourceLocationId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
              style={{ borderColor: "var(--muted-2)" }}
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Destination Location (To) *
            </label>
            <select
              value={destinationLocationId}
              onChange={(e) => setDestinationLocationId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
              style={{ borderColor: "var(--muted-2)" }}
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
        <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--muted-2)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Product Lines
            </h3>
            <button
              type="button"
              onClick={addLine}
              className="btn-outline text-xs py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--muted-2)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--muted-2)", background: "var(--muted-1)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Product
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-500 w-36">
                    Demand Qty
                  </th>
                  {operationType === "DELIVERY" && (
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-500 w-36">
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
                      className={`border-b transition-colors ${
                        isOutOfStock ? "bg-red-50" : "hover:bg-gray-50"
                      }`}
                      style={{ borderColor: isOutOfStock ? "#FECACA" : "var(--muted-2)" }}
                    >
                      <td className="px-4 py-3">
                        <select
                          value={line.productId}
                          onChange={(e) => updateLine(idx, "productId", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm rounded border bg-white outline-none"
                          style={{ borderColor: "var(--muted-2)" }}
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
                          <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
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
                          className="w-full px-2.5 py-1.5 text-sm rounded border text-right bg-white outline-none"
                          style={{ borderColor: "var(--muted-2)" }}
                          required
                        />
                      </td>
                      {operationType === "DELIVERY" && (
                        <td className="px-4 py-3 text-right font-medium">
                          {line.productId ? (
                            <span className={isOutOfStock ? "text-red-700 font-bold" : "text-emerald-700"}>
                              {stock ?? 0}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          className="p-1 rounded text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Notes / Reference Info (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add any internal instructions or remarks..."
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
            style={{ borderColor: "var(--muted-2)" }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--muted-2)" }}>
          <Link href={backHref} className="btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Creating..." : "Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
