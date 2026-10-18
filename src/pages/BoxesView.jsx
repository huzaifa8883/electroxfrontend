import { useEffect, useState, useMemo } from "react";
import { PackageSearch, Plus, Pencil, Trash2, X, Boxes, AlertTriangle, RotateCcw, Search, Check } from "lucide-react";
import * as api from "../services/api";

export default function BoxesView() {
  const [boxes, setBoxes] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null); // full detail of selected box
  const [showForm, setShowForm] = useState(false);
  const [editingBox, setEditingBox] = useState(null);
  const [form, setForm] = useState({ box_number: "", rack_location: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [assigningId, setAssigningId] = useState(null); // product currently being assigned

  const loadBoxes = () => {
    setLoading(true);
    setError(null);
    api.getBoxes()
      .then((r) => setBoxes(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load boxes. Check your connection and try again."))
      .finally(() => setLoading(false));
  };

  const loadAllProducts = () => {
    api.getProducts()
      .then((r) => setAllProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAllProducts([]));
  };

  useEffect(() => {
    loadBoxes();
    loadAllProducts();
  }, []);

  const openDetail = async (box) => {
    try {
      const { data } = await api.getBox(box.id);
      setSelectedBox(data);
      setProductSearch("");
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't load this box.");
    }
  };

  const assignProductToBox = async (product) => {
    if (!selectedBox) return;
    // already in this box? skip
    if (String(product.box_id) === String(selectedBox.id)) return;

    setAssigningId(product.id);
    try {
      await api.assignBox(product.id, selectedBox.id);
      // refresh box detail + boxes list + products list
      const { data } = await api.getBox(selectedBox.id);
      setSelectedBox(data);
      loadBoxes();
      loadAllProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't assign product to this box.");
    } finally {
      setAssigningId(null);
    }
  };

  const openCreate = () => {
    setEditingBox(null);
    setForm({ box_number: "", rack_location: "", description: "" });
    setShowForm(true);
  };

  const openEdit = (box) => {
    setEditingBox(box);
    setForm({ box_number: box.box_number, rack_location: box.rack_location || "", description: box.description || "" });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingBox) {
        await api.updateBox(editingBox.id, form);
      } else {
        await api.createBox(form);
      }
      setShowForm(false);
      loadBoxes();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't save this box.");
    }
  };

  const removeBox = async (id) => {
    if (!confirm("Delete this box? Products inside will be unassigned, not deleted.")) return;
    try {
      await api.deleteBox(id);
      if (selectedBox?.id === id) setSelectedBox(null);
      loadBoxes();
      loadAllProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't delete this box.");
    }
  };

  // All products filtered by search, with current box info
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (!q) return true;
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.box_number || "").toLowerCase().includes(q)
      );
    });
  }, [allProducts, productSearch]);

  // Products already inside the selected box (for the top section)
  const productsInBox = useMemo(() => {
    if (!selectedBox) return [];
    return (selectedBox.products || []);
  }, [selectedBox]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes size={22} className="text-cyan-400" /> Boxes
          </h2>
          <p className="text-sm text-slate-400">Click a box → see all products → click product to add it to that box.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Box
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <RotateCcw size={18} className="animate-spin" /> Loading boxes…
        </div>
      )}

      {!loading && error && (
        <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Couldn't load boxes</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={loadBoxes} className="btn-secondary mx-auto"><RotateCcw size={14} /> Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boxes.map((box) => (
            <div
              key={box.id}
              className={`group relative rounded-2xl border backdrop-blur-xl p-5 transition-all cursor-pointer ${
                selectedBox?.id === box.id
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-white/10 bg-white/5 hover:border-cyan-500/40"
              }`}
              onClick={() => openDetail(box)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300">
                  <PackageSearch size={18} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(box); }} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white">
                    <Pencil size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeBox(box.id); }} className="p-1.5 rounded-md bg-white/10 text-rose-400 hover:text-rose-300">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <h3 className="text-white font-semibold">{box.box_number}</h3>
              <p className="text-xs text-slate-500 mb-3">{box.rack_location || "No location set"}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <div className="flex-1 rounded-lg bg-black/20 border border-white/5 px-2.5 py-1.5 text-center">
                  <p className="text-sm font-bold text-white leading-tight">{box.product_count ?? 0}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {Number(box.product_count) === 1 ? "product" : "products"}
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5 text-center">
                  <p className="text-sm font-bold text-cyan-300 leading-tight">{box.total_quantity ?? 0}</p>
                  <p className="text-[10px] text-cyan-400/70 leading-tight">units total</p>
                </div>
              </div>
            </div>
          ))}
          {boxes.length === 0 && (
            <p className="text-sm text-slate-500 col-span-full">No boxes yet. Click "Add Box" to create one.</p>
          )}
        </div>
      )}

      {/* Selected box panel — shows products currently in box + ALL products to assign */}
      {selectedBox && (
        <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0">
                <PackageSearch size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedBox.box_number}</h3>
                <p className="text-xs text-slate-500">
                  {selectedBox.rack_location || "No location"} · {selectedBox.product_count ?? 0} products · {selectedBox.total_quantity ?? 0} units
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedBox(null)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Products currently inside this box */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-cyan-300 mb-2">Products in this box</h4>
            {productsInBox.length === 0 ? (
              <p className="text-sm text-slate-500 py-3 px-4 rounded-lg border border-dashed border-white/10">
                No products in this box yet. Click any product below to add it here.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {productsInBox.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <span className="text-xs text-cyan-300 font-medium shrink-0">{p.stock ?? 0} pcs</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ALL products — click to assign to this box */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-semibold text-white">All products — click to add to <span className="text-cyan-300">{selectedBox.box_number}</span></h4>
              <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products…"
                  className="input-field pl-8 text-sm py-1.5"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {filteredProducts.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No products found.</p>
              )}
              {filteredProducts.map((p) => {
                const isInThisBox = String(p.box_id) === String(selectedBox.id);
                const isAssigning = assigningId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isInThisBox && !isAssigning && assignProductToBox(p)}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                      isInThisBox
                        ? "bg-cyan-500/10 border-cyan-500/30 cursor-default"
                        : "bg-white/5 border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 cursor-pointer"
                    }`}
                    title={isInThisBox ? "Already in this box" : "Click to add to this box"}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        SKU: {p.sku}
                        {p.box_number ? (
                          <span className="ml-2">· Current box: <span className="text-slate-400">{p.box_number}</span></span>
                        ) : (
                          <span className="ml-2 text-slate-600">· Unassigned</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">{p.stock ?? 0} pcs</span>
                      {isInThisBox ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded-md">
                          <Check size={12} /> In box
                        </span>
                      ) : isAssigning ? (
                        <span className="text-xs text-slate-400">Adding…</span>
                      ) : (
                        <span className="text-xs text-slate-500 group-hover:text-cyan-300">+ Add</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit box form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <form
            onSubmit={submitForm}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingBox ? "Edit Box" : "Add Box"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div>
              <label className="text-xs text-slate-400">Box Number *</label>
              <input
                required
                value={form.box_number}
                onChange={(e) => setForm({ ...form, box_number: e.target.value })}
                placeholder="e.g. Box-101, Shelf-3"
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Rack / Location</label>
              <input
                value={form.rack_location}
                onChange={(e) => setForm({ ...form, rack_location: e.target.value })}
                placeholder="e.g. Aisle 2 - Rack B"
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="input-field mt-1"
              />
            </div>
            <button className="btn-primary w-full">
              {editingBox ? "Save Changes" : "Create Box"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
