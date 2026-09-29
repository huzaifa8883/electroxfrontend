import { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Package, Search, LayoutGrid, Table as TableIcon,
  ImagePlus, Loader2, AlertTriangle, RotateCcw, ChevronLeft, ChevronRight,
  MapPin, Box, Tag, Layers, FileText, List, Eye,
} from "lucide-react";
import * as api from "../services/api";

export const CATEGORIES = [
  "Solar", "Batteries", "Battery Chargers", "Power Supplies",
  "Mobile Accessories", "Home Appliances", "Cables", "CCTV", "Lighting",
];

const emptyForm = {
  sku: "", name: "", category: CATEGORIES[0], stock: 0, min_stock: 5,
  cost_price: 0, selling_price: 0, box_id: "", image_url: "", images: [],
  location: "", description: "", characteristics: "",
};

const MAX_IMAGES = 7;

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

function galleryOf(p) {
  const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  if (p.image_url && !imgs.includes(p.image_url)) return [p.image_url, ...imgs];
  return imgs.length ? imgs : (p.image_url ? [p.image_url] : []);
}

function parseCharacteristics(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx > 0) {
        return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
      }
      return { key: null, value: line };
    });
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
  const [view, setView] = useState("grid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailIdx, setDetailIdx] = useState(0);

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
        || (p.box_number || "").toLowerCase().includes(q)
        || (p.description || "").toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const status = stockStatus(p).label;
      const matchesStock = !stockFilter || status === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    const imgs = galleryOf(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category || CATEGORIES[0],
      stock: p.stock,
      min_stock: p.min_stock,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      box_id: p.box_id || "",
      image_url: p.image_url || imgs[0] || "",
      images: imgs,
      location: p.location || "",
      description: p.description || "",
      characteristics: p.characteristics || "",
    });
    setShowForm(true);
  };

  const openDetail = (p) => {
    setDetail(p);
    setDetailIdx(0);
  };

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      alert(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const urls = [];
      for (const file of toUpload) {
        const { data } = await api.uploadProductImage(file);
        if (data?.url) urls.push(data.url);
      }
      setForm((f) => {
        const next = [...f.images, ...urls].slice(0, MAX_IMAGES);
        return { ...f, images: next, image_url: next[0] || f.image_url };
      });
    } catch (err) {
      alert(err.response?.data?.error || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx) => {
    setForm((f) => {
      const next = f.images.filter((_, i) => i !== idx);
      return { ...f, images: next, image_url: next[0] || "" };
    });
  };

  const setCover = (idx) => {
    setForm((f) => {
      const next = [...f.images];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return { ...f, images: next, image_url: picked };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        box_id: form.box_id || null,
        stock: Number(form.stock) || 0,
        min_stock: Number(form.min_stock) || 0,
        cost_price: Number(form.cost_price) || 0,
        selling_price: Number(form.selling_price) || 0,
        images: form.images,
        image_url: form.images[0] || form.image_url || null,
      };
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
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.deleteProduct(id);
      if (detail?.id === id) setDetail(null);
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, box, category or description..."
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

      {!loading && !error && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => {
            const status = stockStatus(p);
            const margin = marginPercent(p);
            const fillPct = Math.min(100, Math.round((p.stock / Math.max(p.min_stock * 3, 1)) * 100));
            const imgs = galleryOf(p);
            return (
              <div
                key={p.id}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-pointer"
                onClick={() => openDetail(p)}
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                  {imgs[0] ? (
                    <img src={api.resolveImageUrl(imgs[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Package size={40} className="text-slate-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border backdrop-blur-md ${status.color}`}>{status.label}</span>
                    {imgs.length > 1 && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-black/50 text-slate-200 backdrop-blur-md">{imgs.length} photos</span>
                    )}
                  </div>
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-1 rounded-md bg-black/50 text-slate-200 backdrop-blur-md">{p.stock} pcs</span>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openDetail(p)} className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 border border-cyan-500/30" title="View details">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(p)} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/10" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/20" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {p.category && (
                    <p className="text-[11px] text-cyan-400 font-medium mb-1 flex items-center gap-1">
                      <Tag size={10} /> {p.category}
                    </p>
                  )}
                  <p className="text-white font-semibold text-sm truncate leading-snug">{p.name}</p>
                  <p className="text-xs text-slate-500 mb-2.5">{p.sku}</p>
                  {p.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-cyan-300">Rs. {Number(p.selling_price || 0).toLocaleString()}</span>
                    <span className="text-xs text-emerald-400 font-medium">{margin}% margin</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.stock <= p.min_stock ? "bg-amber-400" : "bg-emerald-400"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  {p.box_number && (
                    <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                      <Box size={10} /> {p.box_number}
                    </p>
                  )}
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
              {filtered.map((p) => {
                const imgs = galleryOf(p);
                return (
                  <tr
                    key={p.id}
                    className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => openDetail(p)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {imgs[0] ? (
                            <img src={api.resolveImageUrl(imgs[0])} alt={p.name} className="w-full h-full object-cover" />
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
                    <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openDetail(p)} className="p-1.5 rounded-md bg-white/10 text-cyan-300 hover:text-cyan-200 inline-flex"><Eye size={13} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white inline-flex"><Pencil size={13} /></button>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-md bg-white/10 text-rose-400 hover:text-rose-300 inline-flex"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && (() => {
        const imgs = galleryOf(detail);
        const status = stockStatus(detail);
        const margin = marginPercent(detail);
        const chars = parseCharacteristics(detail.characteristics);
        const activeImg = imgs[detailIdx] || imgs[0];
        return (
          <div className="fixed inset-0 z-50 flex bg-slate-950/95 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto my-4 sm:my-8 px-4 sm:px-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setDetail(null)}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} /> Back to products
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { openEdit(detail); setDetail(null); }} className="btn-secondary text-sm">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => remove(detail.id)} className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-sm hover:bg-rose-500/20 flex items-center gap-1.5">
                    <Trash2 size={14} /> Delete
                  </button>
                  <button onClick={() => setDetail(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10">
                    <div className="relative aspect-square rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-white/5">
                      {activeImg ? (
                        <img src={api.resolveImageUrl(activeImg)} alt={detail.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package size={64} className="text-slate-700" />
                      )}
                      {imgs.length > 1 && (
                        <>
                          <button
                            onClick={() => setDetailIdx((i) => (i - 1 + imgs.length) % imgs.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={() => setDetailIdx((i) => (i + 1) % imgs.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </div>
                    {imgs.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {imgs.map((url, i) => (
                          <button
                            key={url + i}
                            onClick={() => setDetailIdx(i)}
                            className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                              i === detailIdx ? "border-cyan-400 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={api.resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {detail.category && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {detail.category}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{detail.name}</h1>
                      <p className="text-sm text-slate-500 mt-1">SKU: {detail.sku}</p>
                    </div>

                    <div className="flex items-end gap-3 flex-wrap">
                      <span className="text-3xl font-extrabold text-cyan-300">
                        Rs. {Number(detail.selling_price || 0).toLocaleString()}
                      </span>
                      {Number(detail.cost_price) > 0 && (
                        <span className="text-sm text-slate-500 mb-1">
                          Cost: Rs. {Number(detail.cost_price).toLocaleString()} · {margin}% margin
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Stock</p>
                        <p className={`text-xl font-bold ${detail.stock <= detail.min_stock ? "text-amber-400" : "text-emerald-400"}`}>
                          {detail.stock} <span className="text-xs font-normal text-slate-500">pcs</span>
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Min Stock</p>
                        <p className="text-xl font-bold text-white">{detail.min_stock}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Box</p>
                        <p className="text-sm font-semibold text-cyan-300 truncate">{detail.box_number || "Unassigned"}</p>
                      </div>
                    </div>

                    {(detail.location || detail.box_number) && (
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-slate-500" />
                        <span>{[detail.box_number, detail.location].filter(Boolean).join(" · ")}</span>
                      </div>
                    )}

                    {detail.description && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <FileText size={12} /> Description
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{detail.description}</p>
                      </div>
                    )}

                    {chars.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <List size={12} /> Characteristics
                        </h3>
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                          {chars.map((c, i) => (
                            <div
                              key={i}
                              className={`flex gap-3 px-3.5 py-2.5 text-sm ${i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}`}
                            >
                              {c.key ? (
                                <>
                                  <span className="text-slate-500 w-32 shrink-0">{c.key}</span>
                                  <span className="text-slate-200">{c.value}</span>
                                </>
                              ) : (
                                <span className="text-slate-300">{c.value}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detail.supplier_name && (
                      <p className="text-xs text-slate-500">Supplier: <span className="text-slate-300">{detail.supplier_name}</span></p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5 my-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editing ? "Edit Product" : "Add Product"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block flex items-center gap-1.5">
                <ImagePlus size={12} /> Product Photos (up to {MAX_IMAGES})
              </label>
              <div className="flex flex-wrap gap-2.5">
                {form.images.map((url, i) => (
                  <div key={url + i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                    <img src={api.resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-cyan-500/80 text-white py-0.5 font-medium">Cover</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {i !== 0 && (
                        <button type="button" onClick={() => setCover(i)} className="p-1 rounded bg-white/20 text-white text-[10px]" title="Set as cover">★</button>
                      )}
                      <button type="button" onClick={() => removeImage(i)} className="p-1 rounded bg-rose-500/40 text-white"><X size={12} /></button>
                    </div>
                  </div>
                ))}
                {form.images.length < MAX_IMAGES && (
                  <label className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/40 hover:bg-white/5 transition-colors">
                    {uploading ? (
                      <Loader2 size={18} className="text-cyan-400 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus size={18} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 mt-1">Add</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} disabled={uploading} />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">First image is the cover. Click ★ on hover to change cover.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Field label="Stock (Quantity)" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
              <Field label="Min Stock" type="number" value={form.min_stock} onChange={(v) => setForm({ ...form, min_stock: v })} />
              <Field label="Cost Price" type="number" value={form.cost_price} onChange={(v) => setForm({ ...form, cost_price: v })} />
              <Field label="Selling Price" type="number" value={form.selling_price} onChange={(v) => setForm({ ...form, selling_price: v })} />
              <div className="sm:col-span-2">
                <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Aisle 2, Shelf B" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <FileText size={11} /> Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Write a clear product description..."
                className="input-field resize-y min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Layers size={11} /> Characteristics
              </label>
              <textarea
                value={form.characteristics}
                onChange={(e) => setForm({ ...form, characteristics: e.target.value })}
                rows={4}
                placeholder={"One per line, e.g.\nVoltage: 12V\nCapacity: 100Ah\nWarranty: 1 Year"}
                className="input-field resize-y min-h-[100px] font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">Use Key: Value format (one per line) for a clean detail view.</p>
            </div>

            <button disabled={uploading} className="btn-primary w-full">
              {uploading ? "Uploading…" : editing ? "Save Changes" : "Create Product"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }) {
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-field mt-1"
      />
    </div>
  );
}
