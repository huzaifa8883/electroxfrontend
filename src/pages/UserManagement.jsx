import { useEffect, useState } from "react";
import {
  ShieldCheck, Plus, Pencil, Trash2, X, KeyRound, Eye, PenLine, FilePlus, XCircle,
  AlertTriangle, RotateCcw, Loader2,
} from "lucide-react";
import * as api from "../services/api";

const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "boxes", label: "Boxes" },
  { key: "customers", label: "Customers" },
  { key: "sales", label: "Sales & Invoices" },
  { key: "stock_ledger", label: "Stock Ledger" },
  { key: "reports", label: "Reports" },
  { key: "users", label: "Users & Roles (admin)" },
];

const emptyPermission = (module) => ({ module, can_view: false, can_create: false, can_edit: false, can_delete: false });
const blankPermissions = () => MODULES.map((m) => emptyPermission(m.key));

// Quick presets so an admin doesn't have to tick every box by hand
const PRESETS = {
  "Read only": (p) => ({ ...p, can_view: true, can_create: false, can_edit: false, can_delete: false }),
  "Read & Write": (p) => ({ ...p, can_view: true, can_create: true, can_edit: false, can_delete: false }),
  "Full access": (p) => ({ ...p, can_view: true, can_create: true, can_edit: true, can_delete: true }),
  "No access": () => null,
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [userForm, setUserForm] = useState({ username: "", password: "", full_name: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);

  const [permTarget, setPermTarget] = useState(null); // { user, role, permissions, isNew }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = () => api.getUsers().then((r) => setUsers(Array.isArray(r.data) ? r.data : []));
  const loadRoles = () => api.getRoles().then((r) => setRoles(Array.isArray(r.data) ? r.data : []));

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([loadUsers(), loadRoles()])
      .catch((err) => setError(err.response?.data?.error || "Couldn't load users. Check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const roleFor = (user) => roles.find((r) => r.id === user.role_id);

  /* ----- Add / edit a user account ----- */
  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ username: "", password: "", full_name: "" });
    setFormError("");
    setShowUserForm(true);
  };
  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({ username: u.username, password: "", full_name: u.full_name || "" });
    setFormError("");
    setShowUserForm(true);
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingUser) {
        const payload = { full_name: userForm.full_name };
        if (userForm.password) payload.password = userForm.password;
        await api.updateUserAccount(editingUser.id, payload);
        setShowUserForm(false);
        loadUsers();
        return;
      }

      // 1) create a private access-role for this user (starts with zero permissions)
      const role = await api.createRole({ name: `access-${userForm.username}-${Date.now()}`, permissions: blankPermissions() });
      // 2) create the user account attached to that role
      const { data: newUser } = await api.createUserAccount({ ...userForm, role_id: role.data.id });

      setShowUserForm(false);
      await loadRoles();
      await loadUsers();

      // 3) immediately prompt for permissions
      setPermTarget({ user: newUser, role: role.data, permissions: blankPermissions(), isNew: true });
    } catch (err) {
      setFormError(err.response?.data?.error || "Couldn't save this user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.updateUserAccount(u.id, { is_active: !u.is_active });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't update this user.");
    }
  };
  const removeUser = async (u) => {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    try {
      await api.deleteUserAccount(u.id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't delete this user.");
    }
  };

  /* ----- Permissions editor (per user, backed by their private role) ----- */
  const openPermissions = (u) => {
    const role = roleFor(u);
    if (!role) return alert("This account has no editable access role (e.g. Super Admin).");
    setPermTarget({
      user: u,
      role,
      permissions: MODULES.map((m) => role.permissions.find((p) => p.module === m.key) || emptyPermission(m.key)),
      isNew: false,
    });
  };

  const togglePerm = (moduleKey, field) => {
    setPermTarget((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => p.module === moduleKey ? { ...p, [field]: !p[field] } : p),
    }));
  };

  const applyPreset = (moduleKey, presetName) => {
    setPermTarget((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => p.module === moduleKey ? (PRESETS[presetName](p) || emptyPermission(moduleKey)) : p),
    }));
  };

  const applyPresetToAll = (presetName) => {
    setPermTarget((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => PRESETS[presetName](p) || emptyPermission(p.module)),
    }));
  };

  const savePermissions = async () => {
    try {
      await api.updateRole(permTarget.role.id, { permissions: permTarget.permissions });
      setPermTarget(null);
      loadRoles();
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't save permissions.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-400" /> Users & Roles
          </h2>
          <p className="text-sm text-slate-400">Add staff accounts, then decide exactly what each one can see and do.</p>
        </div>
        <button onClick={openCreateUser} className="btn-primary">
          <Plus size={16} /> Add User
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 size={18} className="animate-spin" /> Loading users…
        </div>
      )}

      {!loading && error && (
        <div className="glass-card border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Couldn't load users</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={loadAll} className="btn-secondary mx-auto"><RotateCcw size={14} /> Retry</button>
        </div>
      )}

      {!loading && !error && (
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">Full Name</th>
              <th className="text-left px-4 py-3">Access</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = roleFor(u);
              const viewCount = role?.permissions?.filter((p) => p.can_view).length || 0;
              return (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-white">{u.username}</td>
                  <td className="px-4 py-3 text-slate-300">{u.full_name || "—"}</td>
                  <td className="px-4 py-3">
                    {u.is_system ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-xs">Super Admin — full access</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 text-xs">{viewCount} module{viewCount !== 1 ? "s" : ""} granted</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)} className={`text-xs px-2 py-1 rounded-md ${u.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-500/10 text-slate-400"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!u.is_system && (
                      <button onClick={() => openPermissions(u)} className="p-1.5 rounded-md bg-white/10 text-cyan-300 hover:text-cyan-200 inline-flex" title="Permissions"><KeyRound size={13} /></button>
                    )}
                    <button onClick={() => openEditUser(u)} className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white inline-flex"><Pencil size={13} /></button>
                    {!u.is_system && (
                      <button onClick={() => removeUser(u)} className="p-1.5 rounded-md bg-white/10 text-rose-400 hover:text-rose-300 inline-flex"><Trash2 size={13} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
      )}

      {/* ---------------- Add/Edit user modal (no role picker) ---------------- */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowUserForm(false)}>
          <form onSubmit={submitUser} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingUser ? "Edit User" : "Add User"}</h3>
              <button type="button" onClick={() => setShowUserForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {formError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div>
              <label className="text-xs text-slate-400">Username {editingUser && "(cannot be changed)"}</label>
              <input
                required disabled={!!editingUser}
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className="input-field mt-1 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Full Name</label>
              <input
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">{editingUser ? "New Password (leave blank to keep current)" : "Password *"}</label>
              <input
                required={!editingUser}
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="input-field mt-1"
                placeholder="min. 6 characters"
              />
            </div>

            {!editingUser && (
              <p className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                No role to pick — right after this, you'll set exactly what this user can view, create, edit or delete.
              </p>
            )}

            <button disabled={saving} className="btn-primary w-full">
              {saving ? "Saving…" : editingUser ? "Save Changes" : "Add User"}
            </button>
          </form>
        </div>
      )}

      {/* ---------------- Permissions modal ---------------- */}
      {permTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setPermTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {permTarget.isNew ? "Set Permissions" : "Edit Permissions"} — {permTarget.user.username}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tick exactly what this user is allowed to do, module by module.</p>
              </div>
              <button type="button" onClick={() => setPermTarget(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-1">Apply to all modules:</span>
              {Object.keys(PRESETS).map((name) => (
                <button key={name} type="button" onClick={() => applyPresetToAll(name)}
                  className="text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40">
                  {name}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Module</th>
                    <th className="px-3 py-2"><Eye size={12} className="inline mr-1" />View (Read)</th>
                    <th className="px-3 py-2"><FilePlus size={12} className="inline mr-1" />Create (Write)</th>
                    <th className="px-3 py-2"><PenLine size={12} className="inline mr-1" />Edit</th>
                    <th className="px-3 py-2"><XCircle size={12} className="inline mr-1" />Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((m) => {
                    const p = permTarget.permissions.find((x) => x.module === m.key);
                    return (
                      <tr key={m.key} className="border-t border-white/5">
                        <td className="px-3 py-2 text-slate-200">{m.label}</td>
                        {["can_view", "can_create", "can_edit", "can_delete"].map((field) => (
                          <td key={field} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={p?.[field] || false}
                              onChange={() => togglePerm(m.key, field)}
                              className="w-4 h-4 accent-cyan-500"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button onClick={savePermissions} className="btn-primary w-full">
              Save Permissions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
