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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
            Warehouses
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#18191D] border border-[#212228] text-slate-400 font-normal">
              {warehouses.length} Facilities
            </span>
          </h1>
          <p className="text-xs mt-1 text-slate-400">
            Configure physical hubs, internal zones, and automated location routing codes
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={15} /> New Warehouse ➔
        </button>
      </div>

      {/* Inline Create Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#212228] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#212228] pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span className="text-[#DDFF46]">➔</span> Add New Warehouse
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#18191D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Warehouse, Mumbai Depot"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Short Code *
                </label>
                <input
                  value={form.shortCode}
                  onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. WH, DEPOT"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-[#DDFF46] outline-none font-mono uppercase focus:border-[#DDFF46] transition-colors"
                  maxLength={10}
                  required
                />
                <p className="text-[11px] text-slate-500 font-mono mt-1">Used as prefix for operations (e.g. WH/IN/0001)</p>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Physical street address, city, pin code"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#212228]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-[#2A2B33] hover:bg-[#18191D] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors shadow-sm disabled:opacity-50"
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
            <div key={i} className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-3">
              <div className="h-6 w-32 rounded bg-[#18191D] animate-pulse" />
              <div className="h-4 w-48 rounded bg-[#18191D] animate-pulse" />
            </div>
          ))
        ) : warehouses.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-slate-500 rounded-2xl border border-[#212228] bg-[#121316]">
            No warehouses configured. Click &ldquo;New Warehouse ➔&rdquo; to add one.
          </div>
        ) : (
          warehouses.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl border border-[#212228] bg-[#121316] p-6 flex flex-col justify-between hover:border-slate-600 transition-all relative group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#18191D] border border-[#212228] text-[#DDFF46] flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base font-mono">{w.name}</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#1A2204] text-[#DDFF46] border border-[#DDFF46]/30 font-semibold inline-block mt-0.5">
                        Code: {w.shortCode}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(w.id, w.name)}
                    className="p-1.5 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete warehouse"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {w.address ? (
                  <p className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                    <MapPin size={14} className="flex-shrink-0 text-slate-500 mt-0.5" />
                    {w.address}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic pt-1 font-mono">No street address configured</p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[#212228] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Locations Assigned</span>
                <span className="font-semibold text-[#DDFF46] px-2 py-0.5 rounded-full bg-[#18191D] border border-[#212228]">
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
