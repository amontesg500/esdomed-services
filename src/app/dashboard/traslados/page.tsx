"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { SolicitudTraslado, EstadoTraslado } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightLeft, Clock, X, Building2, RefreshCw } from "lucide-react";

const FILTROS: { label: string; value: EstadoTraslado | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendientes", value: "pendiente" },
  { label: "En revisión", value: "en_revision" },
  { label: "Aprobados", value: "aprobado" },
  { label: "Rechazados", value: "rechazado" },
];

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";

export default function DashboardTrasladosPage() {
  const { profile } = useAuth();
  const [traslados, setTraslados] = useState<SolicitudTraslado[]>([]);
  const [filtro, setFiltro] = useState<EstadoTraslado | "todos">("pendiente");
  const [selected, setSelected] = useState<SolicitudTraslado | null>(null);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "traslados"), orderBy("creadoEn", "desc"));
    return onSnapshot(q, s => setTraslados(s.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudTraslado))));
  }, []);

  const filtered = filtro === "todos" ? traslados : traslados.filter(t => t.estado === filtro);

  const actualizarEstado = async (estado: EstadoTraslado) => {
    if (!selected?.id || !profile) return;
    setSaving(true);
    await updateDoc(doc(db, "traslados", selected.id), {
      estado, notasEsdomed: notas,
      revisadoPor: profile.uid, revisadoPorNombre: profile.nombre,
      actualizadoEn: Timestamp.now(),
    });
    setSaving(false); setSelected(null); setNotas("");
  };

  const getTipoLabel = (tipo?: string) => {
    if (tipo === "servicio_cama") return { label: "Servicio a Servicio", color: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800", icon: Building2 };
    if (tipo === "interno") return { label: "Interno", color: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800", icon: ArrowRightLeft };
    if (tipo === "intercambio") return { label: "Intercambio", color: "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800", icon: RefreshCw };
    return { label: "Traslado", color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700", icon: ArrowRightLeft };
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-900">
            <ArrowRightLeft size={17} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Solicitudes de traslado</h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl">
          <Clock size={14} />
          {traslados.filter(t => t.estado === "pendiente").length} pendiente(s)
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTROS.map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value)}
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
        {filtered.map(t => {
          const typeInfo = getTipoLabel(t.tipoTraslado);
          const Icon = typeInfo.icon;
          
          return (
            <div key={t.id} onClick={() => { setSelected(t); setNotas(t.notasEsdomed ?? ""); }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeInfo.color}`}>
                      <Icon size={10} /> {typeInfo.label}
                    </span>
                  </div>

                  {t.tipoTraslado === "intercambio" ? (
                    <div className="space-y-1 mt-2">
                      <div className="text-sm">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">Exp. {t.pacienteExpediente}</span>
                        {t.pacienteNombre && <span className="text-slate-500 ml-1">({t.pacienteNombre})</span>}
                        <span className="text-xs text-slate-500 ml-2">↔</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 ml-2">Exp. {t.pacienteBExpediente}</span>
                        {t.pacienteBNombre && <span className="text-slate-500 ml-1">({t.pacienteBNombre})</span>}
                      </div>
                      <p className="text-xs text-slate-500">Servicios: {t.servicioOrigen} / {t.servicioDestino}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        Exp. {t.pacienteExpediente} {t.pacienteNombre ? `- ${t.pacienteNombre}` : ""}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {t.servicioOrigen} (Cama {t.camaOrigen}) → {t.tipoTraslado === "interno" ? t.servicioOrigen : t.servicioDestino} (Cama {t.camaDestino})
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2">Dr. {t.medicoNombre} · {t.medicoServicio}</p>
                </div>
                <Badge estado={t.estado} />
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">
                {selected.tipoTraslado === "intercambio" ? "Solicitud de Intercambio" : "Solicitud de Traslado"}
              </h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              
              {selected.tipoTraslado === "intercambio" ? (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Paciente A (Se mueve a cama {selected.camaDestino})</p>
                    <Row label="Expediente"  value={selected.pacienteExpediente} />
                    <Row label="Nombre"      value={selected.pacienteNombre || "No especificado"} />
                    <Row label="Ubicación"   value={`${selected.servicioOrigen} / Cama ${selected.camaOrigen}`} />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Paciente B (Se mueve a cama {selected.camaOrigen})</p>
                    <Row label="Expediente"  value={selected.pacienteBExpediente} />
                    <Row label="Nombre"      value={selected.pacienteBNombre || "No especificado"} />
                    <Row label="Ubicación"   value={`${selected.servicioDestino} / Cama ${selected.camaDestino}`} />
                  </div>
                </>
              ) : (
                <>
                  <Row label="Expediente"  value={selected.pacienteExpediente} />
                  <Row label="Paciente"    value={selected.pacienteNombre || "No especificado"} />
                  <Row label="Origen"      value={`${selected.servicioOrigen} / Cama ${selected.camaOrigen}`} />
                  <Row label="Destino"     value={`${selected.tipoTraslado === "interno" ? selected.servicioOrigen : selected.servicioDestino} / Cama ${selected.camaDestino}`} />
                </>
              )}
              
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

              <Row label="Motivo"      value={selected.motivoTraslado} />
              <Row label="Médico"      value={`Dr. ${selected.medicoNombre} (${selected.medicoServicio})`} />
              <Row label="Estado"      value={<Badge estado={selected.estado} />} />
              
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notas ESDOMED</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
                  placeholder="Observaciones o motivo de rechazo..."
                  className={inputCls} />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-end bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
              <button onClick={() => actualizarEstado("rechazado")} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50 transition-colors">
                Rechazar
              </button>
              <button onClick={() => actualizarEstado("en_revision")} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50 transition-colors">
                En revisión
              </button>
              <button onClick={() => actualizarEstado("aprobado")} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : "Aprobar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-slate-500 w-24 shrink-0 text-xs pt-0.5 font-medium">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium text-sm flex-1">{value}</span>
    </div>
  );
}
