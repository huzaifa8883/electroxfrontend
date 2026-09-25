import { useEffect, useState } from "react";
import { ScrollText, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import * as api from "../services/api";

export default function StockLedger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api.getStockLedger()
      .then((r) => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the stock ledger. Check your connection and try again."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const typeColor = {
    sale: "text-rose-400", purchase: "text-emerald-400",
    adjustment: "text-amber-400", return: "text-cyan-400",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <ScrollText size={20} className="text-cyan-400" /> Stock Ledger
      </h2>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 size={18} className="animate-spin" /> Loading ledger…
        </div>
      )}

      {!loading && error && (
        <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Couldn't load the stock ledger</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={load} className="btn-secondary mx-auto"><RotateCcw size={14} /> Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Mobile: card list */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {entries.map((e) => (
              <div key={e.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{e.product_name || "—"}</span>
                  <span className={`text-xs capitalize font-semibold ${typeColor[e.type] || "text-slate-300"}`}>{e.type}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{e.sku} · {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${e.quantity_changed < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {e.quantity_changed > 0 ? `+${e.quantity_changed}` : e.quantity_changed}
                  </span>
                  <span className="text-slate-400">Balance: {e.balance_after}</span>
                </div>
                {e.reference && <p className="text-xs text-slate-500 mt-1">Ref: {e.reference}</p>}
              </div>
            ))}
            {entries.length === 0 && (
              <div className="glass-card text-center py-10 text-slate-500 text-sm border-dashed">No ledger entries yet.</div>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Change</th>
                  <th className="text-left px-4 py-3">Balance</th>
                  <th className="text-left px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-400">{e.created_at ? new Date(e.created_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-white">{e.product_name || "—"} <span className="text-slate-500 text-xs">({e.sku})</span></td>
                    <td className={`px-4 py-3 capitalize ${typeColor[e.type] || "text-slate-300"}`}>{e.type}</td>
                    <td className={`px-4 py-3 font-semibold ${e.quantity_changed < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {e.quantity_changed > 0 ? `+${e.quantity_changed}` : e.quantity_changed}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{e.balance_after}</td>
                    <td className="px-4 py-3 text-slate-500">{e.reference}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No ledger entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
