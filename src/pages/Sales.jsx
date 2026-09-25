import { useEffect, useState } from "react";
import {
  Receipt, ShoppingCart, Plus, Minus, Trash2, Search, X, Printer, FilePlus2, List,
  AlertTriangle, RotateCcw, Loader2,
} from "lucide-react";
import * as api from "../services/api";

export default function Sales() {
  const [tab, setTab] = useState("invoices"); // 'invoices' | 'new'
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);

  const loadSales = () => {
    setLoading(true);
    setError(null);
    return api.getSales()
      .then((r) => setSales(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load invoices. Check your connection and try again."))
      .finally(() => setLoading(false));
  };
  useEffect(loadSales, []);

  const openInvoice = async (s) => {
    try {
      const { data } = await api.getSale(s.id);
      setViewing(data);
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't open this invoice.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt size={20} className="text-cyan-400" /> Sales & Invoices
          </h2>
          <p className="text-sm text-slate-400">Create invoices and review your transaction history.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <button onClick={() => setTab("invoices")} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${tab === "invoices" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
            <List size={13} /> All Invoices
          </button>
          <button onClick={() => setTab("new")} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${tab === "new" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
            <FilePlus2 size={13} /> New Invoice
          </button>
        </div>
      </div>

      {tab === "invoices" && (
        <>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
              <Loader2 size={18} className="animate-spin" /> Loading invoices…
            </div>
          )}
          {!loading && error && (
            <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
              <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Couldn't load invoices</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <button onClick={loadSales} className="btn-secondary mx-auto"><RotateCcw size={14} /> Retry</button>
            </div>
          )}
          {!loading && !error && <InvoiceList sales={sales} onOpen={openInvoice} />}
        </>
      )}
      {tab === "new" && <NewInvoice onCreated={() => { loadSales(); setTab("invoices"); }} />}

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
        No sales recorded yet.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {sales.map((s) => (
          <button key={s.id} onClick={() => onOpen(s)} className="text-left glass-card p-4 active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-300 font-medium text-sm">{s.invoice_no}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-md capitalize ${statusColor[s.status] || "text-slate-300 bg-white/5"}`}>{s.status}</span>
            </div>
            <p className="text-white text-sm mb-1">{s.customer_name || "Walk-in"}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="capitalize">{s.payment_method}</span>
              <span>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-white font-semibold">Rs. {Number(s.total || 0).toLocaleString()}</span>
              <span className="text-emerald-400 text-sm">+Rs. {Number(s.profit || 0).toLocaleString()}</span>
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
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => onOpen(s)}>
                <td className="px-4 py-3 text-cyan-300 font-medium">{s.invoice_no}</td>
                <td className="px-4 py-3 text-white">{s.customer_name || "Walk-in"}</td>
                <td className="px-4 py-3 text-slate-300 capitalize">{s.payment_method}</td>
                <td className="px-4 py-3 text-white font-semibold">Rs. {Number(s.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-emerald-400">Rs. {Number(s.profit || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md capitalize ${statusColor[s.status] || "text-slate-300 bg-white/5"}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); onOpen(s); }} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white inline-flex">
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

/* ==================== NEW INVOICE (cart builder) ==================== */

function NewInvoice({ onCreated }) {
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

  const loadPickerData = () => {
    setLoadError(null);
    Promise.all([api.getProducts(), api.getCustomers()])
      .then(([p, c]) => {
        setProducts(Array.isArray(p.data) ? p.data : []);
        setCustomers(Array.isArray(c.data) ? c.data : []);
      })
      .catch((err) => setLoadError(err.response?.data?.error || "Couldn't load products/customers."));
  };
  useEffect(loadPickerData, []);

  const filtered = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) => prev
      .map((c) => c.product.id === id ? { ...c, quantity: Math.min(c.product.stock, Math.max(1, c.quantity + delta)) } : c)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.product.selling_price * c.quantity, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));

  const handleCheckout = async () => {
    if (!cart.length) return;
    setProcessing(true);
    try {
      const payload = {
        customer_id: customerId || null,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity, unit_price: c.product.selling_price })),
        payment_method: paymentMethod,
        discount: Number(discount || 0),
        tax: Number(tax || 0),
      };
      const { data } = await api.checkout(payload);
      setLastInvoice(data);
      setCart([]);
      setDiscount(0);
      setTax(0);
      api.getProducts().then((r) => setProducts(r.data));
      onCreated?.();
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loadError) {
    return (
      <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <p className="text-white font-medium mb-1">Couldn't load the invoice builder</p>
        <p className="text-sm text-slate-400 mb-4">{loadError}</p>
        <button onClick={loadPickerData} className="btn-secondary mx-auto">Retry</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Product picker */}
      <div className="lg:col-span-2">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
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
              <p className="text-xs text-slate-500">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-cyan-400 font-semibold text-sm">Rs. {Number(p.selling_price || 0).toLocaleString()}</span>
                <span className="text-xs text-slate-500">{p.stock} in stock</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center text-sm text-slate-500 py-8">No products found.</p>}
        </div>
      </div>

      {/* Cart / invoice builder */}
      <div className="glass-card p-5 flex flex-col h-fit lg:sticky lg:top-20">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <ShoppingCart size={16} className="text-cyan-400" /> New Invoice
        </h3>

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="input-field mb-3"
        >
          <option value="">Walk-in Customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex-1 space-y-2 max-h-72 overflow-y-auto mb-4">
          {cart.length === 0 && <p className="text-sm text-slate-500">Cart is empty. Tap a product to add it.</p>}
          {cart.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{product.name}</p>
                <p className="text-xs text-slate-500">Rs. {product.selling_price} × {quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQty(product.id, -1)} className="p-1 rounded bg-white/10 text-slate-300"><Minus size={12} /></button>
                <span className="w-5 text-center text-white">{quantity}</span>
                <button onClick={() => changeQty(product.id, 1)} className="p-1 rounded bg-white/10 text-slate-300"><Plus size={12} /></button>
                <button onClick={() => removeFromCart(product.id)} className="p-1 rounded bg-white/10 text-rose-400 ml-1"><Trash2 size={12} /></button>
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
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="input-field px-2 py-1.5" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Tax (Rs.)</label>
              <input type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)}
                className="input-field px-2 py-1.5" />
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
            {processing ? "Processing…" : "Complete Sale & Create Invoice"}
          </button>
        </div>

        {lastInvoice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            Invoice {lastInvoice.invoice_no} created — Total Rs. {Number(lastInvoice.total).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== INVOICE DETAIL MODAL ==================== */

function InvoiceModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 my-8 print:bg-white print:text-black">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h3 className="text-lg font-bold text-white">Invoice {sale.invoice_no}</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white"><Printer size={15} /></button>
            <button onClick={onClose} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white"><X size={15} /></button>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-cyan-300 font-bold text-lg print:text-black">Electrox Pro</p>
          <p className="text-xs text-slate-500">Invoice #{sale.invoice_no}</p>
          <p className="text-xs text-slate-500">{sale.date ? new Date(sale.date).toLocaleString() : "—"}</p>
        </div>

        <div className="rounded-xl border border-white/10 divide-y divide-white/5 mb-4">
          {(sale.items || []).map((it) => (
            <div key={it.id} className="flex justify-between px-3 py-2 text-sm">
              <div>
                <p className="text-white">{it.name}</p>
                <p className="text-xs text-slate-500">{it.sku} · {it.quantity} × Rs. {Number(it.unit_price || 0).toLocaleString()}</p>
              </div>
              <span className="text-white font-medium">Rs. {Number(it.line_total || 0).toLocaleString()}</span>
            </div>
          ))}
          {(!sale.items || sale.items.length === 0) && (
            <p className="px-3 py-4 text-center text-sm text-slate-500">No line items found for this invoice.</p>
          )}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-400"><span>Discount</span><span>Rs. {Number(sale.discount || 0).toLocaleString()}</span></div>
          <div className="flex justify-between text-slate-400"><span>Tax</span><span>Rs. {Number(sale.tax || 0).toLocaleString()}</span></div>
          <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10"><span>Total</span><span>Rs. {Number(sale.total || 0).toLocaleString()}</span></div>
          <div className="flex justify-between text-emerald-400"><span>Profit</span><span>Rs. {Number(sale.profit || 0).toLocaleString()}</span></div>
          <div className="flex justify-between text-slate-400 capitalize"><span>Payment</span><span>{sale.payment_method || "—"}</span></div>
        </div>
      </div>
    </div>
  );
}
