import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// On startup, re-attach any saved token so a page refresh doesn't lose auth.
const savedToken = localStorage.getItem("electrox_token");
if (savedToken) api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

// If the token is invalid/expired, force back to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("electrox_token");
      delete api.defaults.headers.common.Authorization;
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

/* ---------------- Auth / Users / Roles ---------------- */
export const login = (username, password) => api.post("/auth/login", { username, password });
export const getUsers = () => api.get("/users");
export const createUserAccount = (data) => api.post("/users", data);
export const updateUserAccount = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserAccount = (id) => api.delete(`/users/${id}`);
export const getRoles = () => api.get("/roles");
export const createRole = (data) => api.post("/roles", data);
export const updateRole = (id, data) => api.put(`/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/roles/${id}`);

/* ---------------- Products ---------------- */
export const getProducts = (params) => api.get("/products", { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const assignBox = (id, box_id) => api.patch(`/products/${id}/box`, { box_id });
export const adjustStock = (id, payload) => api.patch(`/products/${id}/stock`, payload);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const uploadProductImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Resolves a stored image path (e.g. "/uploads/products/xyz.jpg") to a full URL
export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

/* ---------------- Boxes ---------------- */
export const getBoxes = () => api.get("/boxes");
export const getBox = (id) => api.get(`/boxes/${id}`);
export const createBox = (data) => api.post("/boxes", data);
export const updateBox = (id, data) => api.put(`/boxes/${id}`, data);
export const deleteBox = (id) => api.delete(`/boxes/${id}`);

/* ---------------- POS ---------------- */
export const checkout = (payload) => api.post("/pos/checkout", payload);
export const getSales = () => api.get("/pos/sales");
export const getSale = (id) => api.get(`/pos/sales/${id}`);

/* ---------------- Dashboard ---------------- */
export const getStats = () => api.get("/dashboard/stats");
export const getTopSellers = (limit) => api.get("/dashboard/top-sellers", { params: { limit } });
export const getLowStock = () => api.get("/dashboard/low-stock");
export const getRevenueGraph = (days) => api.get("/dashboard/revenue-graph", { params: { days } });

/* ---------------- Customers ---------------- */
export const getCustomers = () => api.get("/customers");
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

/* ---------------- Stock Ledger ---------------- */
export const getStockLedger = (product_id) => api.get("/stock-ledger", { params: { product_id } });

export default api;
