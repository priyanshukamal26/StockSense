"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Search, Filter, AlertTriangle, Edit2, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category?: Category;
  unitOfMeasure: string;
  costPerUnit: number;
  reorderPoint: number;
  isActive: boolean;
}

interface StockItem {
  id: string;
  productId: string;
  product: Product;
  locationId: string;
  location: { id: string; name: string; shortCode: string; warehouse?: { name: string } };
  onHandQty: number;
  reservedQty: number;
  freeToUseQty: number;
  costPerUnit: number;
  isLowStock: boolean;
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "stock">("catalog");

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Stock State
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<StockItem | null>(null);

  // New Product Form State
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    unitOfMeasure: "Units",
    costPerUnit: 0,
    reorderPoint: 10,
    initialStock: 0,
  });

  // Quick Category Form State
  const [categoryName, setCategoryName] = useState("");

  // Quick Adjust Form State
  const [adjustCountedQty, setAdjustCountedQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Fetch Products & Categories
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageSize: "100",
        ...(search ? { search } : {}),
        ...(selectedCategory ? { categoryId: selectedCategory } : {}),
      });

      const [pRes, cRes] = await Promise.all([
        api.get<{ data: Product[] }>(`/products?${params}`),
        api.get<{ categories?: Category[]; data?: Category[] }>("/categories"),
      ]);

      const rawCategories = cRes.categories || cRes.data || [];
      setProducts(pRes.data || []);
      setCategories(rawCategories);
      if (!productForm.categoryId && rawCategories.length > 0) {
        setProductForm((prev) => ({ ...prev, categoryId: rawCategories[0].id }));
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, productForm.categoryId]);

  // Fetch Stock
  const fetchStock = useCallback(async () => {
    setStockLoading(true);
    try {
      const params = new URLSearchParams({
        pageSize: "100",
        ...(selectedLocation ? { locationId: selectedLocation } : {}),
      });
      const res = await api.get<{ data: StockItem[] }>(`/stock?${params}`);
      setStockItems(res.data || []);
    } catch {
      toast.error("Failed to load stock data");
    } finally {
      setStockLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (activeTab === "stock") {
      fetchStock();
    }
  }, [activeTab, fetchStock]);

  // Create Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.categoryId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        categoryId: productForm.categoryId,
        unitOfMeasure: productForm.unitOfMeasure,
        costPerUnit: Number(productForm.costPerUnit) || 0,
        reorderPoint: Number(productForm.reorderPoint) || 0,
      };

      const initStock = Number(productForm.initialStock);
      if (initStock > 0) {
        payload.initialStock = initStock;
      }

      await api.post("/products", payload);

      toast.success("Product created successfully");
      setShowProductModal(false);
      setProductForm({
        name: "",
        sku: "",
        categoryId: categories[0]?.id || "",
        unitOfMeasure: "Units",
        costPerUnit: 0,
        reorderPoint: 10,
        initialStock: 0,
      });
      fetchCatalog();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create product";
      toast.error(msg);
    }
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      const res = await api.post<{ category?: Category; data?: Category }>("/categories", {
        name: categoryName.trim(),
      });
      const newCat = res.category || res.data;
      if (newCat) {
        toast.success(`Category "${newCat.name}" created`);
        setCategories((prev) => [...prev, newCat]);
        setProductForm((prev) => ({ ...prev, categoryId: newCat.id }));
      }
      setCategoryName("");
      setShowCategoryModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      toast.error(msg);
    }
  };

  // Adjust Stock Handler (Inline Adjustment)
  const handleOpenAdjust = (item: StockItem) => {
    setAdjustingItem(item);
    setAdjustCountedQty(Number(item.onHandQty));
    setAdjustReason("Periodic manual count");
    setShowAdjustModal(true);
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    setSubmittingAdjust(true);
    try {
      await api.post("/stock/adjust", {
        productId: adjustingItem.productId,
        locationId: adjustingItem.locationId,
        countedQty: Number(adjustCountedQty),
        reason: adjustReason || undefined,
      });

      toast.success("Stock adjustment applied successfully and ledger recorded");
      setShowAdjustModal(false);
      fetchStock();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to adjust stock";
      toast.error(msg);
    } finally {
      setSubmittingAdjust(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
            Products & Inventory
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#18191D] border border-[#212228] text-slate-400 font-normal">
              {products.length} SKUs Cataloged
            </span>
          </h1>
          <p className="text-xs mt-1 text-slate-400">
            Manage master product catalog, reorder points, and live per-location stock levels
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#121316] border border-[#212228]">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === "catalog"
                ? "bg-[#DDFF46] text-black shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Product Catalog
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === "stock"
                ? "bg-[#DDFF46] text-black shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Stock Availability (Live)
          </button>
        </div>
      </div>

      {/* ─── TAB 1: PRODUCT CATALOG ────────────────────────────────────────── */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by SKU or Product Name..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-[#212228] bg-[#121316] text-white placeholder-slate-500 outline-none focus:border-[#DDFF46] transition-colors"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 text-sm rounded-full border border-[#212228] bg-[#121316] text-slate-300 outline-none focus:border-[#DDFF46] transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowProductModal(true)}
              className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={15} /> New Product ➔
            </button>
          </div>

          {/* Catalog Table */}
          <div className="rounded-2xl border border-[#212228] bg-[#121316] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#212228] bg-[#18191D]">
                    <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      SKU
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Product Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Category
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Unit
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Cost / Unit
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Reorder Point
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#212228]">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 w-20 rounded bg-[#18191D] animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500 text-sm">
                        No products found. Click &quot;New Product&quot; to add your first item.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[#212228] hover:bg-[#18191D]/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-xs text-[#DDFF46]">
                          {p.sku}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {p.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 text-xs">
                          {p.category?.name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">
                          {p.unitOfMeasure}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-white">
                          ₹{Number(p.costPerUnit).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400">
                          {p.reorderPoint} {p.unitOfMeasure}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                              p.isActive
                                ? "bg-[#1A2204] text-[#DDFF46] border border-[#DDFF46]/30"
                                : "bg-[#18191D] text-slate-500 border border-[#212228]"
                            }`}
                          >
                            {p.isActive ? "ACTIVE" : "ARCHIVED"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: STOCK AVAILABILITY (WIREFRAME EXACT COLUMNS) ─────────────── */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Location Availability Table (Desk 3000 Rs 50 45 | Table 3000 Rs 50 50)
              </span>
            </div>
            <button
              onClick={fetchStock}
              className="p-2 rounded-full border border-[#212228] bg-[#121316] hover:bg-[#18191D] transition-colors text-slate-300 hover:text-white"
              title="Refresh stock"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="rounded-2xl border border-[#212228] bg-[#121316] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#212228] bg-[#18191D]">
                    <th className="text-left px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Product
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      per unit cost
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      On hand
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Free to Use
                    </th>
                    <th className="text-center px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 w-36">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#212228]">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 w-24 rounded bg-[#18191D] animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : stockItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500 text-sm">
                        No stock records found. Receive inventory to populate quantities.
                      </td>
                    </tr>
                  ) : (
                    stockItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#212228] hover:bg-[#18191D]/60 transition-colors"
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{item.product.name}</span>
                            <span className="font-mono text-xs text-[#DDFF46]">
                              [{item.product.sku}]
                            </span>
                          </div>
                          {item.isLowStock && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full mt-1">
                              <AlertTriangle size={11} /> Low Stock (reorder at {item.product.reorderPoint})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-300 text-xs font-medium">
                          {item.location.name}
                          <span className="text-slate-500 block text-[11px] font-mono mt-0.5">
                            {item.location.warehouse?.name || item.location.shortCode}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-medium text-white">
                          ₹{Number(item.costPerUnit || item.product.costPerUnit).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-white">
                          {Number(item.onHandQty)} {item.product.unitOfMeasure}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-[#DDFF46]">
                          {Number(item.freeToUseQty)} {item.product.unitOfMeasure}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#2A2B33] bg-[#121316] text-slate-300 hover:text-white hover:border-[#DDFF46] hover:bg-[#18191D] transition-all inline-flex items-center gap-1"
                            title="Update stock from here"
                          >
                            <Edit2 size={12} /> Update stock
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
      )}

      {/* ─── MODAL: NEW PRODUCT ────────────────────────────────────────────── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#212228] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in text-white">
            <div className="flex items-center justify-between border-b border-[#212228] pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span className="text-[#DDFF46]">➔</span> New Product
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#18191D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Product Name *
                  </label>
                  <input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Desk, Office Chair, Steel Sheet"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    SKU / Code *
                  </label>
                  <input
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. DESK001"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-[#DDFF46] outline-none font-mono uppercase focus:border-[#DDFF46] transition-colors"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-xs text-[#DDFF46] hover:underline font-semibold"
                    >
                      + New
                    </button>
                  </div>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={productForm.unitOfMeasure}
                    onChange={(e) => setProductForm({ ...productForm, unitOfMeasure: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                  >
                    <option value="Units">Units (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="m">Meters (m)</option>
                    <option value="box">Box</option>
                    <option value="litres">Litres</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Cost / Unit (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.costPerUnit}
                    onChange={(e) =>
                      setProductForm({ ...productForm, costPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.reorderPoint}
                    onChange={(e) =>
                      setProductForm({ ...productForm, reorderPoint: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Initial Stock (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.initialStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, initialStock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212228]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-[#2A2B33] hover:bg-[#18191D] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors shadow-sm">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: QUICK CATEGORY ────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#212228] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-white">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-[#DDFF46]">➔</span> Add Product Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category Name
                </label>
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Furniture, Raw Materials"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#212228]">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-[#2A2B33] hover:bg-[#18191D] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors shadow-sm">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: INLINE STOCK ADJUSTMENT ─────────────────────────────────── */}
      {showAdjustModal && adjustingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#212228] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in text-white">
            <div className="flex items-center justify-between border-b border-[#212228] pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <span className="text-[#DDFF46]">➔</span> Update Stock
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {adjustingItem.product.name} ({adjustingItem.location.name})
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#18191D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#0C0D0E] border border-[#212228] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Recorded On Hand:</span>
                  <span className="font-mono font-bold text-white">
                    {Number(adjustingItem.onHandQty)} {adjustingItem.product.unitOfMeasure}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Free to Use:</span>
                  <span className="font-mono font-bold text-[#DDFF46]">
                    {Number(adjustingItem.freeToUseQty)} {adjustingItem.product.unitOfMeasure}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  New Counted Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={adjustCountedQty}
                  onChange={(e) => setAdjustCountedQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors font-mono font-bold text-base"
                  required
                />
                <p className="text-xs mt-1 text-slate-400 font-mono">
                  Difference:{" "}
                  <strong
                    className={
                      adjustCountedQty - Number(adjustingItem.onHandQty) >= 0
                        ? "text-[#DDFF46]"
                        : "text-rose-400"
                    }
                  >
                    {adjustCountedQty - Number(adjustingItem.onHandQty) >= 0 ? "+" : ""}
                    {adjustCountedQty - Number(adjustingItem.onHandQty)}{" "}
                    {adjustingItem.product.unitOfMeasure}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Periodic physical count, scrap, broken item"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212228]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-[#2A2B33] hover:bg-[#18191D] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingAdjust ? "Applying..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
