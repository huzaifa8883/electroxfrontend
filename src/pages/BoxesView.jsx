import { useEffect, useState } from "react";
import { PackageSearch, Plus, Pencil, Trash2, X, Boxes, AlertTriangle, RotateCcw } from "lucide-react";
import * as api from "../services/api";

export default function BoxesView() {
  const [boxes, setBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null); // full detail w/ products
  const [showForm, setShowForm] = useState(false);
  const [editingBox, setEditingBox] = useState(null);
  const [form, setForm] = useState({ box_number: "", rack_location: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBoxes = () => {
    setLoading(true);
    setError(null);
    api.getBoxes()
      .then((r) => setBoxes(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load boxes. Check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBoxes(); }, []);

  const openDetail = async (box) => {
    try {
      const { data } = await api.getBox(box.id);
      setSelectedBox(data);
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't load this box.");
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
      loadBoxes();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't delete this box.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes size={20} className="text-cyan-400" /> Box Management
          </h2>
          <p className="text-sm text-slate-400">Track exactly which physical box or shelf holds each product.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Box
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading boxes…</p>}

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
              className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 hover:border-cyan-500/40 transition-all cursor-pointer"
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

      {/* Box detail modal */}
      {selectedBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedBox(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0">
                  <PackageSearch size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedBox.box_number}</h3>
                  <p className="text-xs text-slate-500">{selectedBox.rack_location || "No location set"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBox(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-center">
                <p className="text-xl font-bold text-white leading-tight">{selectedBox.product_count ?? 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {Number(selectedBox.product_count) === 1 ? "Product" : "Products"} in this box
                </p>
              </div>
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-3 text-center">
                <p className="text-xl font-bold text-cyan-300 leading-tight">{selectedBox.total_quantity ?? 0}</p>
                <p className="text-xs text-cyan-400/70 mt-0.5">Total units stored</p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {(selectedBox.products || []).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6 rounded-lg border border-dashed border-white/10">
                  No products stored in this box.
                </p>
              )}
              {(selectedBox.products || []).map((p) => {
                const stock = Number(p.stock) || 0;
                const minStock = Number(p.min_stock) || 0;
                const low = stock <= minStock;
                const out = stock <= 0;
                const dotColor = out ? "bg-rose-400" : low ? "bg-amber-400" : "bg-emerald-400";
                const textColor = out ? "text-rose-300" : low ? "text-amber-400" : "text-emerald-400";
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md bg-black/20 ${textColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {stock} pcs
                    </span>
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
