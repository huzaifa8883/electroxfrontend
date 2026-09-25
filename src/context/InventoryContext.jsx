import { createContext, useContext, useState, useCallback } from "react";
import * as api from "../services/api";

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshProducts = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data } = await api.getProducts(params);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBoxes = useCallback(async () => {
    const { data } = await api.getBoxes();
    setBoxes(data);
  }, []);

  // Called after POS checkout so product lists reflect deducted stock immediately
  const applyStockDelta = useCallback((productId, newStock) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  }, []);

  return (
    <InventoryContext.Provider
      value={{ products, boxes, loading, refreshProducts, refreshBoxes, applyStockDelta }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
