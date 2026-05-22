"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile, UserRole } from "@/types";
import { Users } from "lucide-react";

interface NuevoUsuario { nombre: string; email: string; password: string; userRole: UserRole; servicio: string; }
const EMPTY_FORM: NuevoUsuario = { nombre: "", email: "", password: "", userRole: "medico", servicio: "" };

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function DashboardUsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NuevoUsuario>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const getToken = async () => (await user?.getIdToken()) ?? "";

  const fetchUsuarios = async () => {
    const token = await getToken();
    const res = await fetch("/api/usuarios", { headers: { Authorization: `Bearer ${token}` } });
    setUsuarios(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (user) fetchUsuarios(); }, [user]); // eslint-disable-line

  const set = (field: keyof NuevoUsuario) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear usuario");
      setForm(EMPTY_FORM); setShowForm(false); await fetchUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally { setSaving(false); }
  };

  const handleDelete = async (uid: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
    setDeletingUid(uid);
    const token = await getToken();
    await fetch(`/api/usuarios/${uid}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeletingUid(null); await fetchUsuarios();
  };

  const roleColors = {
    esdomed: "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900",
    trabajo_social: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    medico: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
  };

  const roleLabels = {
    esdomed: "ESDOMED",
    trabajo_social: "Trabajo Social",
    medico: "Médico"
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-300 dark:border-slate-700">
            <Users size={17} className="text-slate-600 dark:text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Gestión de usuarios</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Crear nuevo usuario</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre completo</label>
              <input type="text" value={form.nombre} onChange={set("nombre")} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Correo electrónico</label>
              <input type="email" value={form.email} onChange={set("email")} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Contraseña inicial</label>
              <input type="password" value={form.password} onChange={set("password")} required minLength={6} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Rol</label>
              <select value={form.userRole} onChange={set("userRole")} className={inputCls}>
                <option value="medico">Médico</option>
                <option value="esdomed">Personal ESDOMED</option>
              </select>
            </div>
            {form.userRole === "medico" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Servicio del médico</label>
                <input type="text" value={form.servicio} onChange={set("servicio")}
                  placeholder="Ej: Medicina Interna, Cirugía, Pediatría..."
                  className={inputCls} />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
            {saving ? "Creando usuario..." : "Crear usuario"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-10">Cargando usuarios...</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {["Nombre", "Correo", "Rol", "Servicio", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usuarios.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Sin usuarios registrados.</td></tr>
              )}
              {usuarios.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[u.role] || roleColors.medico}`}>
                      {roleLabels[u.role] || "Médico"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.servicio || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(u.uid, u.nombre)} disabled={deletingUid === u.uid}
                      className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 transition-colors">
                      {deletingUid === u.uid ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
