"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NotificacionFallecido } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { HeartPulse, Clock, X } from "lucide-react";

export default function DashboardFallecidosPage() {
  const { profile } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionFallecido[]>([]);
  const [filtro, setFiltro] = useState<"pendiente" | "confirmado" | "todos">("pendiente");
  const [selected, setSelected] = useState<NotificacionFallecido | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notificaciones_fallecidos"), orderBy("creadoEn", "desc"));
    return onSnapshot(q, s => setNotificaciones(s.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionFallecido))));
  }, []);

  const filtered = filtro === "todos" ? notificaciones : notificaciones.filter(n => n.estado === filtro);

  const confirmar = async () => {
    if (!selected?.id || !profile) return;
    setSaving(true);
    await updateDoc(doc(db, "notificaciones_fallecidos", selected.id), {
      estado: "confirmado",
      confirmadoPor: profile.uid, confirmadoPorNombre: profile.nombre,
      confirmadoEn: Timestamp.now(),
    });
    setSaving(false); setSelected(null);
  };

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950 rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-900">
            <HeartPulse size={17} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Notificaciones de fallecidos</h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl">
          <Clock size={14} />
          {notificaciones.filter(n => n.estado === "pendiente").length} sin confirmar
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[{ label: "Todos", value: "todos" }, { label: "Pendientes", value: "pendiente" }, { label: "Confirmados", value: "confirmado" }].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value as typeof filtro)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 py-10 text-center">Sin notificaciones en este filtro.</p>
        )}
        {filtered.map(n => (
          <div key={n.id} onClick={() => setSelected(n)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-rose-300 dark:hover:border-rose-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{n.pacienteNombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">Exp. {n.pacienteExpediente}</p>
                <p className="text-xs text-slate-500 mt-1">{n.servicio} / Cama {n.cama} · Fallecido: {formatFecha(n.fechaDefuncion)}</p>
                <p className="text-xs text-slate-500 mt-1">Dr. {n.medicoNombre}</p>
              </div>
              <Badge estado={n.estado} />
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">Notificación de fallecido</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Row label="Paciente"        value={selected.pacienteNombre} />
              <Row label="Expediente"      value={selected.pacienteExpediente} />
              <Row label="Servicio"        value={selected.servicio} />
              <Row label="Cama"            value={selected.cama} />
              <Row label="Fecha defunción" value={formatFecha(selected.fechaDefuncion)} />
              {selected.causaMuerte && <Row label="Causa" value={selected.causaMuerte} />}
              <Row label="Notificado por"  value={`Dr. ${selected.medicoNombre} (${selected.medicoServicio})`} />
              <Row label="Estado"          value={<Badge estado={selected.estado} />} />
              {selected.confirmadoPorNombre && <Row label="Confirmado por" value={selected.confirmadoPorNombre} />}
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
      <span className="text-slate-500 w-28 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium text-sm">{value}</span>
    </div>
  );
}
