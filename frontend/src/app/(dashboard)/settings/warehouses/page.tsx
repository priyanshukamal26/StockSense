"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Building2, MapPin, X } from "lucide-react";
import { toast } from "sonner";

interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
  address?: string | null;
  locations?: Array<{ id: string; name: string; shortCode: string }>;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    shortCode: "",
    address: "",
  });

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Warehouse[] }>("/warehouses");
      setWarehouses(res.data || []);
    } catch {
      toast.error("Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shortCode) {
      toast.error("Name and Short Code are required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/warehouses", {
        name: form.name,
        shortCode: form.shortCode.toUpperCase(),
        address: form.address || undefined,
      });
      toast.success(`Warehouse "${form.name}" created`);
      setForm({ name: "", shortCode: "", address: "" });
      setShowAddForm(false);
      fetchWarehouses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create warehouse";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete warehouse "${name}"?`)) return;
    try {
      await api.delete(`/warehouses/${id}`);
      toast.success("Warehouse deleted");
      fetchWarehouses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete warehouse";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header with verbatim caption from wireframe */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Warehouses</h1>
          <p className="text-sm mt-0.5 text-gray-500 italic">
            &ldquo;This page contains the warehouse details & location.&rdquo;
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Warehouse
        </button>
      </div>

      {/* Inline Create Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Add New Warehouse</h3>
              <button
                onClick={() => setShowAddForm(false)}
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
                  placeholder="e.g. Main Warehouse, Mumbai Depot"
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
                  placeholder="e.g. WH, DEPOT"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none font-mono uppercase"
                  style={{ borderColor: "var(--muted-2)" }}
                  maxLength={10}
                  required
                />
                <p className="text-[11px] text-gray-400 mt-0.5">Used as prefix for operations (e.g. WH/IN/0001)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Physical street address, city, pin code"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: "var(--muted-2)" }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Saving..." : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouses Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="ss-card space-y-3">
              <div className="skeleton h-6 w-32 rounded" />
              <div className="skeleton h-4 w-48 rounded" />
            </div>
          ))
        ) : warehouses.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-500 ss-card">
            No warehouses configured. Click &ldquo;New Warehouse&rdquo; to add one.
          </div>
        ) : (
          warehouses.map((w) => (
            <div
              key={w.id}
              className="ss-card flex flex-col justify-between hover:shadow-md transition-shadow relative group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{w.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                        Code: {w.shortCode}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(w.id, w.name)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete warehouse"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {w.address ? (
                  <p className="text-xs text-gray-600 flex items-start gap-1 mt-2">
                    <MapPin size={14} className="flex-shrink-0 text-gray-400 mt-0.5" />
                    {w.address}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No address provided</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                <span>Locations assigned</span>
                <span className="font-semibold text-gray-900">
                  {w.locations?.length || 0} locations
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
