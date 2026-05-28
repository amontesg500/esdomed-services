"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NotificacionFallecido } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { HeartPulse, Plus, CheckCircle2, AlertCircle, X, Search } from "lucide-react";
import { useServicios } from "@/contexts/ServiciosContext";

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

const EMPTY = {
  pacienteNombre: "", pacienteExpediente: "",
  servicio: "", cama: "", fechaDefuncion: "", causaMuerte: "",
};

type ModalState = { type: "success"; expediente: string; nombre: string } | { type: "error"; message: string } | null;

export default function MedicoFallecidosPage() {
  const { user, profile } = useAuth();
  const { servicios, getCamas } = useServicios();
  const [notificaciones, setNotificaciones] = useState<NotificacionFallecido[]>([]);
  const [busquedaExpediente, setBusquedaExpediente] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notificaciones_fallecidos"), where("medicoId", "==", user.uid));
    return onSnapshot(q, s => {
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionFallecido));
      docs.sort((a, b) => {
        const at = (a.creadoEn as { toDate?: () => Date }).toDate?.()?.getTime() ?? 0;
        const bt = (b.creadoEn as { toDate?: () => Date }).toDate?.()?.getTime() ?? 0;
        return bt - at;
      });
      setNotificaciones(docs);
    });
  }, [user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const onServicioChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, servicio: e.target.value, cama: "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "notificaciones_fallecidos"), {
        pacienteNombre: form.pacienteNombre,
        pacienteExpediente: form.pacienteExpediente,
        servicio: form.servicio,
        cama: form.cama,
        fechaDefuncion: Timestamp.fromDate(new Date(form.fechaDefuncion)),
        causaMuerte: form.causaMuerte,
        medicoId: user.uid,
        medicoNombre: profile.nombre,
        medicoServicio: profile.servicios?.join(" / ") || profile.servicio || "",
        estado: "pendiente",
        creadoEn: Timestamp.now(),
      });
      setModal({ type: "success", expediente: form.pacienteExpediente, nombre: form.pacienteNombre });
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      setModal({ type: "error", message: err instanceof Error ? err.message : "No se pudo enviar la notificación." });
    } finally {
      setSaving(false);
    }
  };

  const displayList = notificaciones.filter(n => {
    if (busquedaExpediente && !(n.pacienteExpediente?.toLowerCase() ?? "").includes(busquedaExpediente.toLowerCase())) return false;
    if (fechaDesde || fechaHasta) {
      const d = ((n.creadoEn as unknown) as { toDate?: () => Date }).toDate?.() ?? n.creadoEn;
      if (fechaDesde && d < new Date(fechaDesde + "T00:00:00")) return false;
      if (fechaHasta && d > new Date(fechaHasta + "T23:59:59")) return false;
    }
    return true;
  });

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleString("es-HN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950 rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-900">
            <HeartPulse size={17} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Notificaciones de fallecido</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancelar" : <><Plus size={15} /> Nueva notificación</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 mb-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre del paciente</label>
              <input type="text" value={form.pacienteNombre} onChange={set("pacienteNombre")} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Número de expediente</label>
              <input type="text" value={form.pacienteExpediente} onChange={set("pacienteExpediente")} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Fecha de defunción</label>
              <input type="datetime-local" value={form.fechaDefuncion} onChange={set("fechaDefuncion")} required
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Servicio</label>
              <select value={form.servicio} onChange={onServicioChange} required className={inputCls}>
                <option value="">Seleccionar servicio...</option>
                {servicios.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Cama</label>
              {(() => {
                const camas = form.servicio ? getCamas(form.servicio) : [];
                return camas.length > 0 ? (
                  <select value={form.cama} onChange={set("cama")} required className={inputCls}>
                    <option value="">Seleccionar cama...</option>
                    {camas.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.cama}
                    onChange={set("cama")}
                    required
                    className={inputCls}
                    placeholder={!form.servicio ? "Primero selecciona el servicio" : ""}
                    disabled={!form.servicio}
                  />
                );
              })()}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Causa de muerte <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea value={form.causaMuerte} onChange={set("causaMuerte")} rows={3}
                className={`${inputCls} resize-none`} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all active:scale-[0.99]">
            {saving ? "Enviando..." : "Enviar notificación"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Buscar por expediente..." value={busquedaExpediente} onChange={e => setBusquedaExpediente(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 shrink-0">Desde</span>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 shrink-0">Hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]" />
        </div>
        {(busquedaExpediente || fechaDesde || fechaHasta) && (
          <button onClick={() => { setBusquedaExpediente(""); setFechaDesde(""); setFechaHasta(""); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors">
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* History list */}
      <div className="space-y-2">
        {displayList.length === 0 && !showForm && (
          <p className="text-sm text-slate-500 py-10 text-center">
            {notificaciones.length === 0 ? "No has enviado notificaciones de fallecido." : "Sin resultados para los filtros aplicados."}
          </p>
        )}
        {displayList.map(n => (
          <div key={n.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-rose-200 dark:hover:border-rose-900 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{n.pacienteNombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">Exp. {n.pacienteExpediente}</p>
                <p className="text-xs text-slate-500 mt-1">{n.servicio} · Cama {n.cama}</p>
                <p className="text-xs text-slate-500 mt-0.5">Defunción: {formatFecha(n.fechaDefuncion)}</p>
                {n.causaMuerte && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">Causa: {n.causaMuerte}</p>
                )}
                {n.estado === "confirmado" && n.confirmadoPorNombre && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Confirmado por {n.confirmadoPorNombre} · {formatFecha(n.confirmadoEn)}
                  </p>
                )}
              </div>
              <Badge estado={n.estado} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal de resultado */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
            {modal.type === "success" ? (
              <>
                <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center border border-green-200 dark:border-green-500/30">
                  <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Notificación enviada</p>
                  <p className="text-sm text-slate-500 mt-1">
                    La notificación del paciente{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{modal.nombre}</span>{" "}
                    (Exp.{" "}
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{modal.expediente}</span>
                    ) fue enviada correctamente a ESDOMED.
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Aceptar
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center border border-red-200 dark:border-red-500/30">
                  <AlertCircle size={28} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Error al enviar</p>
                  <p className="text-sm text-slate-500 mt-1">{modal.message}</p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </>
            )}

            {/* X button */}
            <button
              onClick={() => setModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
