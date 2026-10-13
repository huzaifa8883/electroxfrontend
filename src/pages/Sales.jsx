import { useEffect, useState, useMemo } from "react";
import {
  Receipt, ShoppingCart, Plus, Minus, Trash2, Search, X, Printer, FilePlus2, List,
  AlertTriangle, RotateCcw, Loader2, Filter, Calendar, User, Package, Tag,
} from "lucide-react";
import * as api from "../services/api";

export default function Sales() {
  const [tab, setTab] = useState("history"); // 'history' | 'add'
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);

  // Filters for history
  const [period, setPeriod] = useState("all"); // today | week | month | all
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadSales = () => {
    setLoading(true);
    setError(null);
    const params = { period };
    if (customerSearch.trim()) params.customer = customerSearch.trim();
    if (productSearch.trim()) params.product = productSearch.trim();
    if (categoryFilter.trim()) params.category = categoryFilter.trim();

    return api.getSales(params)
      .then((r) => setSales(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load sales history. Check connection."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === "history") loadSales();
  }, [tab, period]);

  // Debounced search on filter change
  useEffect(() => {
    if (tab !== "history") return;
    const t = setTimeout(loadSales, 400);
    return () => clearTimeout(t);
  }, [customerSearch, productSearch, categoryFilter]);

  const openInvoice = async (s) => {
    try {
      const { data } = await api.getSale(s.id);
      setViewing(data);
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't open this invoice.");
    }
  };

  const categories = useMemo(() => {
    // We don't have full product list here; categories will be free-text filter
    return [];
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt size={20} className="text-cyan-400" /> Sales
          </h2>
          <p className="text-sm text-slate-400">
            Add sales to reduce stock automatically. View history with powerful filters. Generate invoices under Suntech Pakistan.
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              tab === "history" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"
            }`}
          >
            <List size={13} /> Sales History
          </button>
          <button
            onClick={() => setTab("add")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              tab === "add" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"
            }`}
          >
            <FilePlus2 size={13} /> Add Sale
          </button>
        </div>
      </div>

      {tab === "history" && (
        <>
          {/* Filters */}
          <div className="glass-card p-4 mb-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300 mb-1">
              <Filter size={14} className="text-cyan-400" /> Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Period */}
              <div>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Calendar size={11} /> Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="input-field"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              {/* Customer search */}
              <div>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <User size={11} /> Customer Name
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer..."
                    className="input-field pl-9"
                  />
                </div>
              </div>
              {/* Product search */}
              <div>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Package size={11} /> Product Name / SKU
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product..."
                    className="input-field pl-9"
                  />
                </div>
              </div>
              {/* Category */}
              <div>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Tag size={11} /> Category
                </label>
                <input
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Filter by category..."
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-500">
                {loading ? "Loading…" : `${sales.length} sale${sales.length !== 1 ? "s" : ""} found`}
              </p>
              <button onClick={loadSales} className="btn-secondary text-xs py-1.5 px-3">
                <RotateCcw size={12} /> Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
              <Loader2 size={18} className="animate-spin" /> Loading sales history…
            </div>
          )}
          {!loading && error && (
            <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
              <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Couldn't load sales</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <button onClick={loadSales} className="btn-secondary mx-auto">
                <RotateCcw size={14} /> Retry
              </button>
            </div>
          )}
          {!loading && !error && <InvoiceList sales={sales} onOpen={openInvoice} />}
        </>
      )}

      {tab === "add" && (
        <NewSale
          onCreated={() => {
            loadSales();
            setTab("history");
          }}
        />
      )}

      {viewing && <InvoiceModal sale={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

/* ==================== INVOICE LIST ==================== */

function InvoiceList({ sales, onOpen }) {
  const statusColor = {
    completed: "text-emerald-300 bg-emerald-500/10",
    refunded: "text-rose-300 bg-rose-500/10",
    void: "text-slate-400 bg-slate-500/10",
  };

  if (sales.length === 0) {
    return (
      <div className="glass-card text-center py-12 text-slate-500 text-sm border-dashed">
        No sales found for the selected filters.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {sales.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpen(s)}
            className="text-left glass-card p-4 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-300 font-medium text-sm">{s.invoice_no}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md capitalize ${
                  statusColor[s.status] || "text-slate-300 bg-white/5"
                }`}
              >
                {s.status}
              </span>
            </div>
            <p className="text-white text-sm mb-1">{s.customer_name || "Walk-in"}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="capitalize">{s.payment_method}</span>
              <span>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-white font-semibold">
                Rs. {Number(s.total || 0).toLocaleString()}
              </span>
              <span className="text-emerald-400 text-sm">
                +Rs. {Number(s.profit || 0).toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Profit</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr
                key={s.id}
                className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                onClick={() => onOpen(s)}
              >
                <td className="px-4 py-3 text-cyan-300 font-medium">{s.invoice_no}</td>
                <td className="px-4 py-3 text-white">{s.customer_name || "Walk-in"}</td>
                <td className="px-4 py-3 text-slate-300 capitalize">{s.payment_method}</td>
                <td className="px-4 py-3 text-white font-semibold">
                  Rs. {Number(s.total || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-emerald-400">
                  Rs. {Number(s.profit || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md capitalize ${
                      statusColor[s.status] || "text-slate-300 bg-white/5"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {s.date ? new Date(s.date).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(s);
                    }}
                    className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white inline-flex"
                    title="View / Print Invoice"
                  >
                    <Receipt size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ==================== ADD SALE (cart builder) ==================== */

function NewSale({ onCreated }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // {product, quantity}
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showInvoiceAfter, setShowInvoiceAfter] = useState(null);

  const loadPickerData = () => {
    setLoadError(null);
    Promise.all([api.getProducts(), api.getCustomers()])
      .then(([p, c]) => {
        setProducts(Array.isArray(p.data) ? p.data : []);
        setCustomers(Array.isArray(c.data) ? c.data : []);
      })
      .catch((err) =>
        setLoadError(err.response?.data?.error || "Couldn't load products/customers.")
      );
  };
  useEffect(loadPickerData, []);

  const filtered = products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === id
            ? {
                ...c,
                quantity: Math.min(c.product.stock, Math.max(1, c.quantity + delta)),
              }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce(
    (sum, c) => sum + Number(c.product.selling_price || 0) * c.quantity,
    0
  );
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));

  const handleCheckout = async () => {
    if (!cart.length) return;
    setProcessing(true);
    try {
      const payload = {
        customer_id: customerId || null,
        items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity,
          unit_price: c.product.selling_price,
        })),
        payment_method: paymentMethod,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
      };
      const { data } = await api.checkout(payload);
      setLastInvoice(data);
      setCart([]);
      setDiscount(0);
      setTax(0);
      setCustomerId("");
      // Fetch full sale for invoice
      const full = await api.getSale(data.id);
      setShowInvoiceAfter(full.data);
      if (onCreated) onCreated();
    } catch (err) {
      alert(err.response?.data?.error || "Sale failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loadError) {
    return (
      <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Couldn't load data</p>
        <p className="text-sm text-slate-400 mb-4">{loadError}</p>
        <button onClick={loadPickerData} className="btn-secondary mx-auto">
          <RotateCcw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-200">
        <strong>Important:</strong> Stock quantity decreases only when you complete a sale here.
        You cannot manually reduce stock for sales tracking. Customer, date, products and all
        details are recorded automatically.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Product picker */}
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU or category..."
              className="input-field pl-9"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <p className="text-sm text-white font-medium truncate">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.sku} {p.category ? `· ${p.category}` : ""}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-cyan-400 font-semibold text-sm">
                    Rs. {Number(p.selling_price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">{p.stock} in stock</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-sm text-slate-500 py-8">
                No products found.
              </p>
            )}
          </div>
        </div>

        {/* Cart / sale builder */}
        <div className="glass-card p-5 flex flex-col h-fit lg:sticky lg:top-20">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-cyan-400" /> New Sale
          </h3>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input-field mb-3"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>

          <div className="flex-1 space-y-2 max-h-72 overflow-y-auto mb-4">
            {cart.length === 0 && (
              <p className="text-sm text-slate-500">Cart is empty. Tap a product to add it.</p>
            )}
            {cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between text-sm py-2 border-b border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    Rs. {product.selling_price} × {quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeQty(product.id, -1)}
                    className="p-1 rounded bg-white/10 text-slate-300"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-white">{quantity}</span>
                  <button
                    onClick={() => changeQty(product.id, 1)}
                    className="p-1 rounded bg-white/10 text-slate-300"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1 rounded bg-white/10 text-rose-400 ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Discount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input-field px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Tax (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="input-field px-2 py-1.5"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-slate-300 font-medium">Total</span>
              <span className="text-white font-bold text-lg">Rs. {total.toLocaleString()}</span>
            </div>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="credit">Credit</option>
            </select>

            <button
              onClick={handleCheckout}
              disabled={!cart.length || processing}
              className="btn-primary w-full"
            >
              {processing ? "Processing…" : "Complete Sale & Generate Invoice"}
            </button>
          </div>

          {lastInvoice && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              Invoice {lastInvoice.invoice_no} created — Total Rs.{" "}
              {Number(lastInvoice.total).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {showInvoiceAfter && (
        <InvoiceModal sale={showInvoiceAfter} onClose={() => setShowInvoiceAfter(null)} />
      )}
    </>
  );
}

/* ==================== BEAUTIFUL INVOICE MODAL — SUNTECH PAKISTAN ==================== */

function InvoiceModal({ sale, onClose }) {
  const printInvoice = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl my-8 print:shadow-none print:border-0 print:bg-white print:text-black print:max-w-none print:rounded-none"
        id="invoice-print-area"
      >
        {/* Toolbar - hidden on print */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 print:hidden">
          <h3 className="text-sm font-semibold text-white">Invoice Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={printInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium hover:bg-cyan-500/30"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ========== PRINTABLE INVOICE ========== */}
        <div className="p-6 sm:p-8 print:p-10">
          {/* Company Header */}
          <div className="text-center mb-6 pb-5 border-b-2 border-cyan-500/40 print:border-slate-300">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 mb-3 print:bg-slate-800">
              <span className="text-white font-black text-xl">SP</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-slate-900">
              SUNTECH PAKISTAN
            </h1>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
              Quality Electronics &amp; Inventory Solutions
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 print:text-slate-500">
              Pakistan · Contact for support
            </p>
          </div>

          {/* Invoice meta */}
          <div className="flex flex-wrap justify-between gap-4 mb-6 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">Invoice No</p>
              <p className="font-bold text-cyan-300 print:text-slate-900">{sale.invoice_no}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">Date</p>
              <p className="text-white print:text-slate-800">
                {sale.date
                  ? new Date(sale.date).toLocaleString("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">Customer</p>
              <p className="text-white print:text-slate-800 font-medium">
                {sale.customer_name || "Walk-in Customer"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">Payment</p>
              <p className="text-white print:text-slate-800 capitalize">
                {sale.payment_method || "—"}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div className="rounded-xl border border-white/10 overflow-hidden mb-5 print:border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase print:bg-slate-100 print:text-slate-600">
                  <th className="text-left px-3 py-2.5">#</th>
                  <th className="text-left px-3 py-2.5">Item</th>
                  <th className="text-center px-3 py-2.5">Qty</th>
                  <th className="text-right px-3 py-2.5">Price</th>
                  <th className="text-right px-3 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((it, idx) => (
                  <tr
                    key={it.id || idx}
                    className="border-t border-white/5 print:border-slate-100"
                  >
                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-white font-medium print:text-slate-900">{it.name}</p>
                      <p className="text-[11px] text-slate-500">{it.sku}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-white print:text-slate-800">
                      {it.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-300 print:text-slate-700">
                      {Number(it.unit_price || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-white font-medium print:text-slate-900">
                      {Number(it.line_total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!sale.items || sale.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No line items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Subtotal</span>
                <span>
                  Rs.{" "}
                  {(
                    Number(sale.total || 0) +
                    Number(sale.discount || 0) -
                    Number(sale.tax || 0)
                  ).toLocaleString()}
                </span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>Discount</span>
                  <span>- Rs. {Number(sale.discount).toLocaleString()}</span>
                </div>
              )}
              {Number(sale.tax) > 0 && (
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>Tax</span>
                  <span>+ Rs. {Number(sale.tax).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/10 print:border-slate-300">
                <span className="font-bold text-white print:text-slate-900">Grand Total</span>
                <span className="text-xl font-extrabold text-cyan-300 print:text-slate-900">
                  Rs. {Number(sale.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/10 text-center print:border-slate-200">
            <p className="text-xs text-slate-400 print:text-slate-500">
              Thank you for your business!
            </p>
            <p className="text-[11px] text-slate-500 mt-1 print:text-slate-400">
              This is a computer-generated invoice from <strong>Suntech Pakistan</strong>
            </p>
            <p className="text-[10px] text-slate-600 mt-2 print:text-slate-400">
              Status: <span className="capitalize">{sale.status || "completed"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
