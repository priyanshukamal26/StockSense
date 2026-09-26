"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, MapPin, X } from "lucide-react";
import { toast } from "sonner";

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
  warehouse?: { id: string; name: string; shortCode: string } | null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    shortCode: "",
    warehouseId: "",
    locationType: "INTERNAL",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, wRes] = await Promise.all([
        api.get<{ data: Location[] }>("/locations"),
        api.get<{ data: Warehouse[] }>("/warehouses"),
      ]);
      setLocations(lRes.data || []);
      setWarehouses(wRes.data || []);
      if (!form.warehouseId && wRes.data?.length > 0) {
        setForm((prev) => ({ ...prev, warehouseId: wRes.data[0].id }));
      }
    } catch {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [form.warehouseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shortCode || !form.warehouseId) {
      toast.error("Please fill in Name, Short Code, and Warehouse.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/locations", {
        name: form.name,
        shortCode: form.shortCode.toUpperCase(),
        warehouseId: form.warehouseId,
        locationType: form.locationType,
      });

      toast.success(`Location "${form.name}" created`);
      setForm({
        name: "",
        shortCode: "",
        warehouseId: warehouses[0]?.id || "",
        locationType: "INTERNAL",
      });
      setShowAddModal(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create location";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) return;
    try {
      await api.delete(`/locations/${id}`);
      toast.success("Location deleted");
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete location";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header with verbatim caption from wireframe */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="text-sm mt-0.5 text-gray-500 italic">
            &ldquo;This holds the multiple locations of warehouse, rooms, etc.&rdquo;
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Location
        </button>
      </div>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Location</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. WH/Stock1, Rack A, Cold Storage"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: "var(--muted-2)" }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Short Code *
                </label>
                <input
                  value={form.shortCode}
                  onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. STOCK1, RACK-A"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none font-mono uppercase"
                  style={{ borderColor: "var(--muted-2)" }}
                  maxLength={15}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Warehouse *
                </label>
                <select
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
                  style={{ borderColor: "var(--muted-2)" }}
                  required
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Location Type
                </label>
                <select
                  value={form.locationType}
                  onChange={(e) => setForm({ ...form, locationType: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white"
                  style={{ borderColor: "var(--muted-2)" }}
                >
                  <option value="INTERNAL">Internal Storage (Racks/Rooms/Stock)</option>
                  <option value="VENDOR">Vendor (Virtual Source for Receipts)</option>
                  <option value="CUSTOMER">Customer (Virtual Destination for Deliveries)</option>
                  <option value="INVENTORY_LOSS">Inventory Loss (Scrap / Damage)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Saving..." : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations Table */}
      <div className="ss-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--muted-2)", background: "var(--muted-1)" }}
              >
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Location Name
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Short Code
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Warehouse
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Type
                </th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--muted-2)" }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 w-24 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-500 text-sm">
                    No locations found. Add your first warehouse location.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr
                    key={loc.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "var(--muted-2)" }}
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-blue-600 flex-shrink-0" />
                        {loc.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-600">
                      {loc.shortCode}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-800">
                      {loc.warehouse?.name || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-700">
                        {loc.locationType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete location"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
