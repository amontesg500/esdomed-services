"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, doc, updateDoc, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NotificacionFallecido, UserProfile } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { HeartPulse, Clock, X, ChevronDown } from "lucide-react";

const COLUMNAS_SEGUIMIENTO = [
  { key: "digitaSimmow",       keyEn: "digitaSimmowEn",       label: "Digita SIMMOW" },
  { key: "entregaCertificado", keyEn: "entregaCertificadoEn", label: "Entrega certificado" },
  { key: "recibeDePs",         keyEn: "recibeDePsEn",         label: "Recibe Psic./T.S." },
] as const;

type CampoSeguimiento = typeof COLUMNAS_SEGUIMIENTO[number]["key"];

export default function DashboardFallecidosPage() {
  const { profile } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionFallecido[]>([]);
  const [personal, setPersonal] = useState<UserProfile[]>([]);
  const [filtro, setFiltro] = useState<"pendiente" | "confirmado" | "todos">("todos");
  const [selected, setSelected] = useState<NotificacionFallecido | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "notificaciones_fallecidos"), orderBy("creadoEn", "desc"));
    const unsub = onSnapshot(q, s =>
      setNotificaciones(s.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionFallecido)))
    );

    // Cargar personal ESDOMED para los dropdowns
    getDocs(query(collection(db, "usuarios"), where("role", "==", "esdomed")))
      .then(snap => setPersonal(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))));

    return unsub;
  }, []);

  const filtered = filtro === "todos" ? notificaciones : notificaciones.filter(n => n.estado === filtro);

  const confirmar = async () => {
    if (!selected?.id || !profile) return;
    setSaving(true);
    await updateDoc(doc(db, "notificaciones_fallecidos", selected.id), {
      estado: "confirmado",
      confirmadoPor: profile.uid,
      confirmadoPorNombre: profile.nombre,
      confirmadoEn: Timestamp.now(),
    });
    setSaving(false); setSelected(null);
  };

  const asignar = async (id: string, campo: CampoSeguimiento, nombre: string) => {
    setUpdatingCell(`${id}-${campo}`);
    await updateDoc(doc(db, "notificaciones_fallecidos", id), {
      [campo]: nombre || null,
      [`${campo}En`]: nombre ? Timestamp.now() : null,
    });
    setUpdatingCell(null);
  };

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatHora = (ts: unknown) => {
    if (!ts) return null;
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleString("es-HN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Productividad: cuántas veces aparece cada persona en cada columna
  const productividad = personal.map(p => ({
    nombre: p.nombre,
    simmow:       notificaciones.filter(n => n.digitaSimmow === p.nombre).length,
    certificado:  notificaciones.filter(n => n.entregaCertificado === p.nombre).length,
    psicologia:   notificaciones.filter(n => n.recibeDePs === p.nombre).length,
    total:        notificaciones.filter(n =>
      n.digitaSimmow === p.nombre || n.entregaCertificado === p.nombre || n.recibeDePs === p.nombre
    ).length,
  })).filter(p => p.total > 0).sort((a, b) => b.total - a.total);

  const pendientes = notificaciones.filter(n => n.estado === "pendiente").length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950 rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-900">
            <HeartPulse size={17} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Notificaciones de fallecidos</h1>
        </div>
        {pendientes > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl">
            <Clock size={14} />
            {pendientes} sin confirmar
          </div>
        )}
      </div>

      {/* Productividad del equipo */}
      {productividad.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Productividad del equipo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {productividad.map(p => (
              <div key={p.nombre} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {p.simmow > 0 && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400">{p.simmow} SIMMOW</span>
                  )}
                  {p.certificado > 0 && (
                    <span className="text-[11px] text-violet-600 dark:text-violet-400">{p.certificado} cert.</span>
                  )}
                  {p.psicologia > 0 && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{p.psicologia} psic.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[{ label: "Todos", value: "todos" }, { label: "Pendientes", value: "pendiente" }, { label: "Confirmados", value: "confirmado" }].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value as typeof filtro)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-500 self-center">{filtered.length} registros</span>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-10 text-center">Sin notificaciones en este filtro.</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paciente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Servicio / Fecha def.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  {COLUMNAS_SEGUIMIENTO.map(col => (
                    <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">

                    {/* Paciente */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{n.pacienteNombre}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Exp. {n.pacienteExpediente}</p>
                    </td>

                    {/* Servicio / Fecha */}
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{n.servicio} · Cama {n.cama}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatFecha(n.fechaDefuncion)}</p>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <Badge estado={n.estado} />
                    </td>

                    {/* Columnas de seguimiento */}
                    {COLUMNAS_SEGUIMIENTO.map(col => {
                      const valor = n[col.key] as string | undefined;
                      const fecha = n[col.keyEn];
                      const cellKey = `${n.id}-${col.key}`;
                      const loading = updatingCell === cellKey;
                      return (
                        <td key={col.key} className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={valor ?? ""}
                              disabled={loading}
                              onChange={e => asignar(n.id!, col.key, e.target.value)}
                              className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer min-w-[130px]"
                            >
                              <option value="">— Sin asignar</option>
                              {personal.map(p => (
                                <option key={p.uid} value={p.nombre}>{p.nombre}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                          {valor && fecha && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{formatHora(fecha)}</p>
                          )}
                        </td>
                      );
                    })}

                    {/* Acción detalles */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(n)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors whitespace-nowrap"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">Notificación de fallecido</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Row label="Paciente"         value={selected.pacienteNombre} />
              <Row label="Expediente"       value={selected.pacienteExpediente} />
              <Row label="Servicio"         value={selected.servicio} />
              <Row label="Cama"             value={selected.cama} />
              <Row label="Fecha defunción"  value={formatFecha(selected.fechaDefuncion)} />
              {selected.causaMuerte && <Row label="Causa" value={selected.causaMuerte} />}
              <Row label="Notificado por"   value={`Dr. ${selected.medicoNombre} (${selected.medicoServicio})`} />
              <Row label="Estado"           value={<Badge estado={selected.estado} />} />
              {selected.confirmadoPorNombre && (
                <Row label="Confirmado por" value={`${selected.confirmadoPorNombre} · ${formatFecha(selected.confirmadoEn)}`} />
              )}
              {(selected.digitaSimmow || selected.entregaCertificado || selected.recibeDePs) && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Seguimiento ESDOMED</p>
                  {selected.digitaSimmow && <Row label="Digita SIMMOW"  value={selected.digitaSimmow} />}
                  {selected.entregaCertificado && <Row label="Entrega cert." value={selected.entregaCertificado} />}
                  {selected.recibeDePs && <Row label="Recibe Psic./T.S." value={selected.recibeDePs} />}
                </div>
              )}
            </div>
            {selected.estado === "pendiente" && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button onClick={confirmar} disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                  {saving ? "Confirmando..." : "Confirmar de leído y notificado"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-slate-500 w-32 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium text-sm">{value}</span>
    </div>
  );
}
