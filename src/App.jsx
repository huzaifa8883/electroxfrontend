import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import BoxesView from "./pages/BoxesView";
import Sales from "./pages/Sales";
import StockLedger from "./pages/StockLedger";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import { Customers, Reports } from "./pages/SimplePages";
import { InventoryProvider } from "./context/InventoryContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

const TITLES = {
  dashboard: ["Dashboard", "Overview of your store performance"],
  products: ["Products", "Catalogue, pricing and stock levels"],
  boxes: ["Boxes", "Physical storage tracking"],
  customers: ["Customers", "Manage customer records"],
  sales: ["Sales & Invoices", "Create invoices and review transaction history"],
  "stock-ledger": ["Stock Ledger", "Full audit trail of stock movement"],
  reports: ["Reports", "Business analytics"],
  users: ["Users & Roles", "Manage staff accounts and access levels"],
};

const PAGES = {
  dashboard: { component: Dashboard, module: "dashboard" },
  products: { component: Products, module: "products" },
  boxes: { component: BoxesView, module: "boxes" },
  customers: { component: Customers, module: "customers" },
  sales: { component: Sales, module: "sales" },
  "stock-ledger": { component: StockLedger, module: "stock_ledger" },
  reports: { component: Reports, module: "reports" },
  users: { component: UserManagement, module: "users" },
};

function AuthenticatedApp() {
  const { can } = useAuth();
  const firstAllowed = Object.entries(PAGES).find(([, v]) => can(v.module, "view"))?.[0] || "dashboard";
  const [active, setActive] = useState(firstAllowed);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setActive(firstAllowed); }, [firstAllowed]);

  const entry = PAGES[active];
  const allowed = entry && can(entry.module, "view");
  const PageComponent = allowed ? entry.component : () => (
    <div className="p-8 text-slate-400 text-sm">You don't have access to this section.</div>
  );
  const [title, subtitle] = TITLES[active] || ["", ""];

  return (
    <InventoryProvider>
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <Sidebar
          active={active}
          onNavigate={setActive}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:ml-64 min-w-0">
          <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
          <ErrorBoundary key={active}>
            <PageComponent />
          </ErrorBoundary>
        </div>
      </div>
    </InventoryProvider>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">Loading…</div>;
  if (!user) return <Login />;
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
