import { useEffect, useState } from "react";
import {
  Users, BarChart3, Plus, Pencil, Trash2, X, Phone, MapPin,
  TrendingUp, DollarSign, Receipt, Percent, AlertTriangle, RotateCcw, Loader2,
} from "lucide-react";
import * as api from "../services/api";

/* ==================== CUSTOMERS ==================== */

const emptyCustomer = { name: "", phone: "", city: "" };

export function Customers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    return api.getCustomers()
      .then((r) => setList(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load customers. Check your connection and try again."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyCustomer); setFormError(""); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name || "", phone: c.phone || "", city: c.city || "" }); setFormError(""); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) await api.updateCustomer(editing.id, form);
      else await api.createCustomer(form);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Couldn't save this customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Remove customer "${c.name}"?`)) return;
    try {
      await api.deleteCustomer(c.id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't delete this customer.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-cyan-400" /> Customers
          </h2>
          <p className="text-sm text-slate-400">{list.length} customer{list.length !== 1 ? "s" : ""} on record</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 size={18} className="animate-spin" /> Loading customers…
        </div>
      )}

      {!loading && error && (
        <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Couldn't load customers</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={load} className="btn-secondary mx-auto"><RotateCcw size={14} /> Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <div key={c.id} className="group relative glass-card p-5 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                  {(c.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{c.name || "Unnamed customer"}</p>
                  <p className="text-xs text-slate-500">Customer #{c.id}</p>
                </div>
                <div className="ml-auto flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white"><Pencil size={12} /></button>
                  <button onClick={() => remove(c)} className="p-1.5 rounded-md bg-white/10 text-rose-400 hover:text-rose-300"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-400">
                <p className="flex items-center gap-2"><Phone size={13} className="text-slate-500" /> {c.phone || "—"}</p>
                <p className="flex items-center gap-2"><MapPin size={13} className="text-slate-500" /> {c.city || "—"}</p>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 text-sm rounded-2xl border border-dashed border-white/10">
              No customers yet — add your first one.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editing ? "Edit Customer" : "Add Customer"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            {formError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{formError}</p>
            )}
            <div>
              <label className="text-xs text-slate-400">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-field mt-1" />
            </div>
            <button disabled={saving} className="btn-primary w-full">
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Customer"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ==================== REPORTS ==================== */

export function Reports() {
  const [graph, setGraph] = useState([]);
  const [stats, setStats] = useState(null);
  const [topSellers, setTopSellers] = useState([]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    api.getRevenueGraph(days)
      .then((r) => setGraph(Array.isArray(r.data) ? r.data : []))
      .catch(() => setGraph([]));
  }, [days]);

  useEffect(() => {
    api.getStats()
      .then((r) => setStats(r.data && typeof r.data === "object" ? r.data : null))
      .catch(() => setStats(null));
    api.getTopSellers(5)
      .then((r) => setTopSellers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTopSellers([]));
  }, []);

  const max = Math.max(...graph.map((g) => Number(g.revenue)), 1);
  const margin = stats && Number(stats.total_revenue) > 0
    ? ((Number(stats.total_profit) / Number(stats.total_revenue)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-cyan-400" /> Reports
          </h2>
          <p className="text-sm text-slate-400">Revenue, profit and sales performance at a glance.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${days === d ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportStat icon={DollarSign} label="Total Revenue" value={`Rs. ${Number(stats?.total_revenue ?? 0).toLocaleString()}`} accent="cyan" />
        <ReportStat icon={TrendingUp} label="Total Profit" value={`Rs. ${Number(stats?.total_profit ?? 0).toLocaleString()}`} accent="green" />
        <ReportStat icon={Percent} label="Profit Margin" value={`${margin}%`} accent="purple" />
        <ReportStat icon={Receipt} label="Sales Today" value={stats?.today_sales_count ?? 0} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <h3 className="text-white font-semibold mb-5">Revenue — Last {days} Days</h3>
          {graph.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {graph.map((g) => {
                const height = (Number(g.revenue) / max) * 100;
                return (
                  <div key={g.day} className="group flex-1 flex flex-col items-center justify-end h-full relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 text-[10px] text-cyan-300 font-semibold whitespace-nowrap">
                      Rs. {Number(g.revenue).toLocaleString()}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t-md group-hover:from-cyan-400 group-hover:to-blue-300 transition-colors min-h-[3px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-[10px] text-slate-500 mt-2">{new Date(g.day).getDate()}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-16 text-center">No sales data yet for this period.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topSellers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.units_sold} sold · Rs. {Number(p.revenue).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {topSellers.length === 0 && <p className="text-sm text-slate-500">No sales recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportStat({ icon: Icon, label, value, accent }) {
  const accents = {
    cyan: "text-cyan-300 bg-cyan-500/10",
    green: "text-emerald-300 bg-emerald-500/10",
    amber: "text-amber-300 bg-amber-500/10",
    purple: "text-purple-300 bg-purple-500/10",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accents[accent]}`}>
        <Icon size={16} />
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
