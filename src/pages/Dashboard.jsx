import { useEffect, useState } from "react";
import { Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import * as api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topSellers, setTopSellers] = useState([]);

  useEffect(() => {
    api.getStats()
      .then((r) => setStats(r.data && typeof r.data === "object" ? r.data : null))
      .catch(console.error);
    api.getLowStock()
      .then((r) => setLowStock(Array.isArray(r.data) ? r.data : []))
      .catch(console.error);
    api.getTopSellers(5)
      .then((r) => setTopSellers(Array.isArray(r.data) ? r.data : []))
      .catch(console.error);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Products" value={stats?.total_products ?? "—"} accent="cyan" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={stats?.low_stock_count ?? "—"} accent="amber" />
        <StatCard icon={DollarSign} label="Today's Sales" value={`Rs. ${Number(stats?.today_sales_total ?? 0).toLocaleString()}`} accent="green" />
        <StatCard icon={TrendingUp} label="Total Profit" value={`Rs. ${Number(stats?.total_profit ?? 0).toLocaleString()}`} accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" /> Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {lowStock.length === 0 && <p className="text-sm text-slate-500">All stock levels are healthy.</p>}
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sku} {p.box_number ? `· ${p.box_number}` : ""}</p>
                </div>
                <span className="text-amber-400 font-semibold">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" /> Top Sellers
          </h3>
          <div className="space-y-2">
            {topSellers.length === 0 && <p className="text-sm text-slate-500">No sales recorded yet.</p>}
            {topSellers.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sku}</p>
                </div>
                <span className="text-cyan-400 font-semibold">{p.units_sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
