import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("electrox_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem("electrox_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("electrox_token", data.token);
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("electrox_token");
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  }, []);

  // can("products", "edit") -> boolean. Super Admin (is_system) always true.
  const can = useCallback((module, action = "view") => {
    if (!user) return false;
    if (user.is_system) return true;
    const perm = (user.permissions || []).find((p) => p.module === module);
    return !!perm?.[`can_${action}`];
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
