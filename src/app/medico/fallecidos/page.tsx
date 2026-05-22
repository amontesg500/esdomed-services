"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NotificacionFallecido } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { HeartPulse, Plus } from "lucide-react";

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

const EMPTY = {
  pacienteNombre: "", pacienteExpediente: "",
  servicio: "", cama: "", fechaDefuncion: "", causaMuerte: "",
};

export default function MedicoFallecidosPage() {
  const { user, profile } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionFallecido[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    await addDoc(collection(db, "notificaciones_fallecidos"), {
      pacienteNombre: form.pacienteNombre,
      pacienteExpediente: form.pacienteExpediente,
      servicio: form.servicio,
      cama: form.cama,
      fechaDefuncion: Timestamp.fromDate(new Date(form.fechaDefuncion)),
      causaMuerte: form.causaMuerte,
      medicoId: user.uid,
      medicoNombre: profile.nombre,
      medicoServicio: profile.servicio ?? "",
      estado: "pendiente",
      creadoEn: Timestamp.now(),
    });
    setSaving(false);
    setForm(EMPTY);
    setShowForm(false);
  };

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
              <input type="text" value={form.servicio} onChange={set("servicio")} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Cama</label>
              <input type="text" value={form.cama} onChange={set("cama")} required className={inputCls} />
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

      {/* History list */}
      <div className="space-y-2">
        {notificaciones.length === 0 && !showForm && (
          <p className="text-sm text-slate-500 py-10 text-center">No has enviado notificaciones de fallecido.</p>
        )}
        {notificaciones.map(n => (
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
    </div>
  );
}
