import { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Package, Search, LayoutGrid, Table as TableIcon,
  ImagePlus, Loader2, AlertTriangle, RotateCcw,
} from "lucide-react";
import * as api from "../services/api";

export const CATEGORIES = [
  "Solar", "Batteries", "Battery Chargers", "Power Supplies",
  "Mobile Accessories", "Home Appliances", "Cables", "CCTV", "Lighting",
];

const emptyForm = {
  sku: "", name: "", category: CATEGORIES[0], stock: 0, min_stock: 5,
  cost_price: 0, selling_price: 0, box_id: "", image_url: "", location: "",
};

function stockStatus(p) {
  if (p.stock <= 0) return { label: "Out of Stock", color: "text-rose-300 bg-rose-500/10 border-rose-500/20" };
  if (p.stock <= p.min_stock) return { label: "Low Stock", color: "text-amber-300 bg-amber-500/10 border-amber-500/20" };
  return { label: "In Stock", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" };
}

function marginPercent(p) {
  const sell = Number(p.selling_price);
  const cost = Number(p.cost_price);
  if (!sell) return 0;
  return Math.max(0, Math.round(((sell - cost) / sell) * 100));
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [view, setView] = useState("grid"); // grid | table

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    return api.getProducts()
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load products. Check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.getBoxes().then((r) => setBoxes(Array.isArray(r.data) ? r.data : [])).catch(() => setBoxes([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q
        || (p.name || "").toLowerCase().includes(q)
        || (p.sku || "").toLowerCase().includes(q)
        || (p.category || "").toLowerCase().includes(q)
        || (p.box_number || "").toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const status = stockStatus(p).label;
      const matchesStock = !stockFilter || status === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, category: p.category || CATEGORIES[0], stock: p.stock, min_stock: p.min_stock,
      cost_price: p.cost_price, selling_price: p.selling_price,
      box_id: p.box_id || "", image_url: p.image_url || "", location: p.location || "",
    });
    setShowForm(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await api.uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      alert(err.response?.data?.error || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, box_id: form.box_id || null };
      if (editing) {
        await api.updateProduct(editing.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't save this product.");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't delete this product.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package size={20} className="text-cyan-400" /> Products
          </h2>
          <p className="text-sm text-slate-400">Catalogue, pricing and stock levels.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, box or category..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All stock</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <button onClick={() => setView("grid")} className={`p-2 rounded-md ${view === "grid" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setView("table")} className={`p-2 rounded-md ${view === "table" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
            <TableIcon size={15} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 size={18} className="animate-spin" /> Loading products…
        </div>
      )}

      {!loading && error && (
        <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Couldn't load products</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={load} className="btn-secondary mx-auto"><RotateCcw size={14} /> Retry</button>
        </div>
      )}

      {/* Grid view */}
      {!loading && !error && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const status = stockStatus(p);
            const margin = marginPercent(p);
            const fillPct = Math.min(100, Math.round((p.stock / Math.max(p.min_stock * 3, 1)) * 100));
            return (
              <div key={p.id} className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:border-cyan-500/30 transition-colors">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={api.resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={40} className="text-slate-600" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border backdrop-blur-md ${status.color}`}>{status.label}</span>
                  </div>
                  <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-md bg-black/50 text-slate-200">{p.stock} pcs</span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"><Pencil size={14} /></button>
                    <button onClick={() => remove(p.id)} className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-4">
                  {p.category && <p className="text-[11px] text-cyan-400 font-medium mb-1">{p.category}</p>}
                  <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 mb-3">{p.sku}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-cyan-300">Rs. {Number(p.selling_price || 0).toLocaleString()}</span>
                    <span className="text-xs text-emerald-400">{margin}% margin</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.stock <= p.min_stock ? "bg-amber-400" : "bg-emerald-400"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500 text-sm rounded-2xl border border-dashed border-white/10">
              No products match your filters.
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {!loading && !error && view === "table" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Box</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                        {p.image_url ? (
                          <img src={api.resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                        ) : <Package size={16} className="text-slate-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    {p.box_number ? (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 text-xs">{p.box_number}</span>
                    ) : <span className="text-slate-600 text-xs">Unassigned</span>}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${p.stock <= p.min_stock ? "text-amber-400" : "text-emerald-400"}`}>{p.stock}</td>
                  <td className="px-4 py-3 text-slate-300">Rs. {Number(p.selling_price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white inline-flex"><Pencil size={13} /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-md bg-white/10 text-rose-400 hover:text-rose-300 inline-flex"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editing ? "Edit Product" : "Add Product"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* Image uploader */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {uploading ? (
                  <Loader2 size={20} className="text-cyan-400 animate-spin" />
                ) : form.image_url ? (
                  <img src={api.resolveImageUrl(form.image_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus size={20} className="text-slate-600" />
                )}
              </div>
              <label className="flex-1 cursor-pointer">
                <span className="block px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 text-center hover:bg-white/10">
                  {form.image_url ? "Change photo" : "Upload photo"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU *" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
              <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field mt-1"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Box Number</label>
                <select
                  value={form.box_id}
                  onChange={(e) => setForm({ ...form, box_id: e.target.value })}
                  className="input-field mt-1"
                >
                  <option value="">Unassigned</option>
                  {boxes.map((b) => <option key={b.id} value={b.id}>{b.box_number}</option>)}
                </select>
              </div>
              <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
              <Field label="Min Stock" type="number" value={form.min_stock} onChange={(v) => setForm({ ...form, min_stock: v })} />
              <Field label="Cost Price" type="number" value={form.cost_price} onChange={(v) => setForm({ ...form, cost_price: v })} />
              <Field label="Selling Price" type="number" value={form.selling_price} onChange={(v) => setForm({ ...form, selling_price: v })} />
            </div>

            <button disabled={uploading} className="btn-primary w-full">
              {editing ? "Save Changes" : "Create Product"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field mt-1"
      />
    </div>
  );
}
