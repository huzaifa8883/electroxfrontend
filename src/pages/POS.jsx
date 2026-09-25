import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search } from "lucide-react";
import * as api from "../services/api";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // {product, quantity}
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  useEffect(() => { api.getProducts().then((r) => setProducts(r.data)); }, []);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
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

  const handleCheckout = async () => {
    if (!cart.length) return;
    setProcessing(true);
    try {
      const payload = {
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity, unit_price: c.product.selling_price })),
        payment_method: paymentMethod,
        discount: 0,
        tax: 0,
      };
      const { data } = await api.checkout(payload);
      setLastInvoice(data);
      setCart([]);
      // refresh stock levels immediately after sale
      api.getProducts().then((r) => setProducts(r.data));
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Product grid */}
      <div className="lg:col-span-2">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className="text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <p className="text-sm text-white font-medium truncate">{p.name}</p>
              <p className="text-xs text-slate-500">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-cyan-400 font-semibold text-sm">Rs. {Number(p.selling_price).toLocaleString()}</span>
                <span className="text-xs text-slate-500">{p.stock} in stock</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col h-fit sticky top-20">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <ShoppingCart size={16} className="text-cyan-400" /> Current Order
        </h3>

        <div className="flex-1 space-y-2 max-h-96 overflow-y-auto mb-4">
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
            <span className="text-white font-semibold">Rs. {subtotal.toLocaleString()}</span>
          </div>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </select>

          <button
            onClick={handleCheckout}
            disabled={!cart.length || processing}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-40"
          >
            {processing ? "Processing…" : "Complete Sale"}
          </button>
        </div>

        {lastInvoice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            Sale completed — Invoice {lastInvoice.invoice_no}, Total Rs. {Number(lastInvoice.total).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
