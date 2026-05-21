"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { SolicitudImpresion } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Printer, Clock } from "lucide-react";

export default function DashboardImpresionesPage() {
  const { profile } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudImpresion[]>([]);
  const [filtro, setFiltro] = useState<"pendiente" | "impreso" | "todos">("pendiente");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "solicitudes_impresion"), orderBy("creadoEn", "desc"));
    return onSnapshot(q, s => setSolicitudes(s.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudImpresion))));
  }, []);

  const filtered = filtro === "todos" ? solicitudes : solicitudes.filter(s => s.estado === filtro);

  const marcarImpreso = async (id: string) => {
    if (!profile) return;
    setSaving(id);
    await updateDoc(doc(db, "solicitudes_impresion", id), {
      estado: "impreso", impresoPor: profile.uid,
      impresoPorNombre: profile.nombre, impresoEn: Timestamp.now(),
    });
    setSaving(null);
  };

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleString("es-HN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950 rounded-xl flex items-center justify-center border border-violet-200 dark:border-violet-900">
            <Printer size={17} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Solicitudes de impresión</h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl">
          <Clock size={14} />
          {solicitudes.filter(s => s.estado === "pendiente").length} pendiente(s)
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[{ label: "Todos", value: "todos" }, { label: "Pendientes", value: "pendiente" }, { label: "Impresos", value: "impreso" }].map(f => (
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
          <p className="text-sm text-slate-500 py-10 text-center">Sin solicitudes en este filtro.</p>
        )}
        {filtered.map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-900 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{s.descripcion}</p>
                  <Badge estado={s.estado} />
                </div>
                <p className="text-xs text-slate-500 mt-1">Dr. {s.medicoNombre} · {s.medicoServicio} · {s.copias} copia(s)</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatFecha(s.creadoEn)}</p>
                {s.estado === "impreso" && s.impresoPorNombre && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">Impreso por {s.impresoPorNombre}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={s.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                  Ver PDF
                </a>
                {s.estado === "pendiente" && (
                  <button onClick={() => marcarImpreso(s.id!)} disabled={saving === s.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                    {saving === s.id ? "..." : "Marcar impreso"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
