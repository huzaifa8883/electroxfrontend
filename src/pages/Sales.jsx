import { useEffect, useState } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, X, Printer,
  AlertTriangle, RotateCcw, Loader2, FilePlus2,
} from "lucide-react";
import * as api from "../services/api";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showInvoiceAfter, setShowInvoiceAfter] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPickerData = () => {
    setLoadError(null);
    setLoading(true);
    Promise.all([api.getProducts(), api.getCustomers()])
      .then(([p, c]) => {
        setProducts(Array.isArray(p.data) ? p.data : []);
        setCustomers(Array.isArray(c.data) ? c.data : []);
      })
      .catch((err) =>
        setLoadError(err.response?.data?.error || "Couldn't load products/customers.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPickerData();
  }, []);

  const filtered = products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    if (!product || product.stock <= 0) return;
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
      // refresh products so stock is up to date
      loadPickerData();
      try {
        const full = await api.getSale(data.id);
        setShowInvoiceAfter(full.data);
      } catch {
        // invoice still created even if detail fetch fails
      }
    } catch (err) {
      alert(err.response?.data?.error || "Sale failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-24">
        <Loader2 size={18} className="animate-spin" /> Loading products…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Couldn't load data</p>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <button onClick={loadPickerData} className="btn-secondary mx-auto">
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FilePlus2 size={20} className="text-cyan-400" /> Add Sale
          </h2>
          <p className="text-sm text-slate-400">
            Stock decreases only when you complete a sale. Customer, date &amp; details are recorded automatically.
          </p>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-200">
        <strong>Important:</strong> Quantity inventory se tabhi kam hogi jab aap yahan se sale complete karoge.
        Manual stock decrease se sales history nahi banegi.
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

        {/* Cart */}
        <div className="glass-card p-5 flex flex-col h-fit lg:sticky lg:top-20">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-cyan-400" /> Cart
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
    </div>
  );
}

/* ==================== INVOICE MODAL ==================== */

function InvoiceModal({ sale, onClose }) {
  if (!sale) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl my-8 print:shadow-none print:border-0 print:bg-white print:text-black"
        id="invoice-print-area-sale"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 print:hidden">
          <h3 className="text-sm font-semibold text-white">Invoice Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
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

        <div className="p-6 sm:p-8 print:p-10">
          <div className="text-center mb-6 pb-5 border-b-2 border-cyan-500/40 print:border-slate-300">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 mb-3">
              <span className="text-white font-black text-xl">SP</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-slate-900">
              SUNTECH PAKISTAN
            </h1>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
              Quality Electronics &amp; Inventory Solutions
            </p>
          </div>

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

          <div className="rounded-xl border border-white/10 overflow-hidden mb-5 print:border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase print:bg-slate-100">
                  <th className="text-left px-3 py-2.5">#</th>
                  <th className="text-left px-3 py-2.5">Item</th>
                  <th className="text-center px-3 py-2.5">Qty</th>
                  <th className="text-right px-3 py-2.5">Price</th>
                  <th className="text-right px-3 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((it, idx) => (
                  <tr key={it.id || idx} className="border-t border-white/5 print:border-slate-100">
                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-white font-medium print:text-slate-900">{it.name}</p>
                      <p className="text-[11px] text-slate-500">{it.sku}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-white print:text-slate-800">
                      {it.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-300">
                      {Number(it.unit_price || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-white font-medium print:text-slate-900">
                      {Number(it.line_total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Discount</span>
                  <span>- Rs. {Number(sale.discount).toLocaleString()}</span>
                </div>
              )}
              {Number(sale.tax) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax</span>
                  <span>+ Rs. {Number(sale.tax).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/10 print:border-slate-300">
                <span className="font-bold text-white print:text-slate-900">Grand Total</span>
                <span className="text-xl font-extrabold text-cyan-300 print:text-slate-900">
                  Rs. {Number(sale.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">Thank you for your business!</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Computer-generated invoice from <strong>Suntech Pakistan</strong>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area-sale, #invoice-print-area-sale * { visibility: visible; }
          #invoice-print-area-sale {
            position: absolute; left: 0; top: 0; width: 100%;
            background: white !important; color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
