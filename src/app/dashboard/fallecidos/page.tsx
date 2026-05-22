"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, doc, updateDoc, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NotificacionFallecido, UserProfile } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { HeartPulse, Clock, X, ChevronDown, CheckCircle2 } from "lucide-react";

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
  const [familiarNombre, setFamiliarNombre] = useState("");
  const [familiarDocumento, setFamiliarDocumento] = useState("");
  const [savingFamiliar, setSavingFamiliar] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notificaciones_fallecidos"), orderBy("creadoEn", "desc"));
    const unsub = onSnapshot(q, s =>
      setNotificaciones(s.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionFallecido)))
    );
    getDocs(query(collection(db, "usuarios"), where("role", "==", "esdomed")))
      .then(snap => setPersonal(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))));
    return unsub;
  }, []);

  // Sincronizar campos del familiar cuando cambia la selección
  useEffect(() => {
    setFamiliarNombre(selected?.familiarNombre ?? "");
    setFamiliarDocumento(selected?.familiarDocumento ?? "");
  }, [selected?.id]);

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
    setSaving(false);
  };

  const asignar = async (campo: CampoSeguimiento, nombre: string) => {
    if (!selected?.id) return;
    setUpdatingCell(campo);
    await updateDoc(doc(db, "notificaciones_fallecidos", selected.id), {
      [campo]: nombre || null,
      [`${campo}En`]: nombre ? Timestamp.now() : null,
    });
    setUpdatingCell(null);
  };

  const guardarFamiliar = async () => {
    if (!selected?.id) return;
    setSavingFamiliar(true);
    await updateDoc(doc(db, "notificaciones_fallecidos", selected.id), {
      familiarNombre:    familiarNombre || null,
      familiarDocumento: familiarDocumento || null,
    });
    setSavingFamiliar(false);
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

  // Productividad
  const productividad = personal.map(p => ({
    nombre: p.nombre,
    simmow:      notificaciones.filter(n => n.digitaSimmow === p.nombre).length,
    certificado: notificaciones.filter(n => n.entregaCertificado === p.nombre).length,
    psicologia:  notificaciones.filter(n => n.recibeDePs === p.nombre).length,
    total:       notificaciones.filter(n =>
      n.digitaSimmow === p.nombre || n.entregaCertificado === p.nombre || n.recibeDePs === p.nombre
    ).length,
  })).filter(p => p.total > 0).sort((a, b) => b.total - a.total);

  const pendientes = notificaciones.filter(n => n.estado === "pendiente").length;

  // Notificación seleccionada actualizada en tiempo real
  const selectedLive = selected ? notificaciones.find(n => n.id === selected.id) ?? selected : null;

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

      {/* Productividad */}
      {productividad.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Productividad del equipo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {productividad.map(p => (
              <div key={p.nombre} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {p.simmow > 0      && <span className="text-[11px] text-blue-600 dark:text-blue-400">{p.simmow} SIMMOW</span>}
                  {p.certificado > 0 && <span className="text-[11px] text-violet-600 dark:text-violet-400">{p.certificado} cert.</span>}
                  {p.psicologia > 0  && <span className="text-[11px] text-rose-600 dark:text-rose-400">{p.psicologia} psic.</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
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
        <span className="ml-auto text-sm text-slate-500">{filtered.length} registros</span>
      </div>

      {/* Tabla limpia */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-10 text-center">Sin notificaciones en este filtro.</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paciente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Servicio / Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Médico</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Seguimiento</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(n => {
                  const pasos = [n.digitaSimmow, n.entregaCertificado, n.recibeDePs].filter(Boolean).length;
                  return (
                    <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{n.pacienteNombre}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Exp. {n.pacienteExpediente}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 dark:text-slate-300">{n.servicio} · Cama {n.cama}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatFecha(n.fechaDefuncion)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                        Dr. {n.medicoNombre}
                      </td>
                      <td className="px-4 py-3">
                        <Badge estado={n.estado} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* 3 indicadores de progreso */}
                          {COLUMNAS_SEGUIMIENTO.map(col => {
                            const hecho = !!n[col.key];
                            return (
                              <div key={col.key} title={col.label}
                                className={`w-2 h-2 rounded-full ${hecho ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                            );
                          })}
                          <span className="text-xs text-slate-500 ml-1">{pasos}/3</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelected(n)}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors whitespace-nowrap">
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel de detalle */}
      {selectedLive && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-[95vw] max-w-5xl max-h-[90vh] flex flex-col">

            {/* Header del panel */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 flex-shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">{selectedLive.pacienteNombre}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Exp. {selectedLive.pacienteExpediente} · {selectedLive.servicio} · Cama {selectedLive.cama}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge estado={selectedLive.estado} />
                <button onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Info del paciente */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-px bg-slate-200 dark:bg-slate-700"></span>
                    Datos del caso
                    <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></span>
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                    <InfoCell label="Fecha defunción" value={formatFecha(selectedLive.fechaDefuncion)} />
                    <InfoCell label="Notificado por"  value={`Dr. ${selectedLive.medicoNombre}`} />
                    <InfoCell label="Servicio"        value={selectedLive.medicoServicio} />
                    {selectedLive.causaMuerte && <InfoCell label="Causa" value={selectedLive.causaMuerte} />}
                  </div>
                </div>

                {/* Seguimiento ESDOMED */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-px bg-slate-200 dark:bg-slate-700"></span>
                    Seguimiento
                    <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></span>
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                    {COLUMNAS_SEGUIMIENTO.map(col => {
                      const valor = selectedLive[col.key] as string | undefined;
                      const fecha = selectedLive[col.keyEn];
                      const loading = updatingCell === col.key;
                      return (
                        <div key={col.key}>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5">{col.label}</label>
                          <div className="relative">
                            <select
                              value={valor ?? ""}
                              disabled={loading}
                              onChange={e => asignar(col.key, e.target.value)}
                              className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              <option value="">— Sin asignar</option>
                              {personal.map(p => (
                                <option key={p.uid} value={p.nombre}>{p.nombre}</option>
                              ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                          {valor && fecha && (
                            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded-md w-fit">
                              <CheckCircle2 size={12} />
                              {formatHora(fecha)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Familiar que retira el certificado */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-px bg-slate-200 dark:bg-slate-700"></span>
                    Familiar
                    <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></span>
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 space-y-4 flex flex-col h-[calc(100%-2rem)]">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre completo</label>
                      <input
                        type="text"
                        value={familiarNombre}
                        onChange={e => setFamiliarNombre(e.target.value)}
                        placeholder="Nombre del familiar"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Documento de identidad</label>
                      <input
                        type="text"
                        value={familiarDocumento}
                        onChange={e => setFamiliarDocumento(e.target.value)}
                        placeholder="Número de identidad"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                    <div className="mt-auto pt-2">
                      <button
                        onClick={guardarFamiliar}
                        disabled={savingFamiliar}
                        className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {savingFamiliar ? "Guardando..." : "Guardar datos"}
                      </button>
                      {selectedLive.familiarNombre && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-start gap-1.5 mt-3 bg-green-50 dark:bg-green-500/10 p-2 rounded-md">
                          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" /> 
                          <span>Guardado:<br/><span className="font-medium text-slate-900 dark:text-slate-100">{selectedLive.familiarNombre}</span><br/><span className="opacity-80">{selectedLive.familiarDocumento}</span></span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: confirmar */}
            {selectedLive.estado === "pendiente" && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                <button onClick={confirmar} disabled={saving}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-green-700 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors">
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

function InfoCell({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{value}</p>
    </div>
  );
}
