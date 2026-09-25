import {
  LayoutDashboard, Package, Users, Receipt, ScrollText,
  BarChart3, Boxes, Zap, ShieldCheck, LogOut, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { id: "products", label: "Products", icon: Package, module: "products" },
  { id: "boxes", label: "Boxes", icon: Boxes, module: "boxes" },
  { id: "customers", label: "Customers", icon: Users, module: "customers" },
  { id: "sales", label: "Sales & Invoices", icon: Receipt, module: "sales" },
  { id: "stock-ledger", label: "Stock Ledger", icon: ScrollText, module: "stock_ledger" },
  { id: "reports", label: "Reports", icon: BarChart3, module: "reports" },
  { id: "users", label: "Users & Roles", icon: ShieldCheck, module: "users" },
];

export default function Sidebar({ active, onNavigate, open, onClose }) {
  const { user, can, logout } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => can(item.module, "view"));
  const initials = (user?.full_name || user?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-72 sm:w-64 flex flex-col bg-slate-950/95 lg:bg-slate-950/80 backdrop-blur-xl border-r border-white/10 z-50
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center gap-2 px-5 sm:px-6 h-16 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="block font-bold text-base text-white tracking-tight truncate leading-tight">Electrox Pro</span>
            <span className="block text-[11px] text-slate-500 leading-tight truncate">Inventory Management</span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); onClose?.(); }}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {initials}
            </div>
            {user && (
              <div className="text-xs min-w-0">
                <p className="text-white font-medium truncate">{user.full_name || user.username}</p>
                <p className="text-slate-500 truncate">{user.is_system ? "Super Admin" : "Staff account"}</p>
              </div>
            )}
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-white/10">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}
