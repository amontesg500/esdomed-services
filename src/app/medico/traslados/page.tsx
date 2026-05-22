"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { SolicitudTraslado } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightLeft, Plus } from "lucide-react";

export default function MedicoTrasladosPage() {
  const { user } = useAuth();
  const [traslados, setTraslados] = useState<SolicitudTraslado[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "traslados"), where("medicoId", "==", user.uid));
    return onSnapshot(q, s => {
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudTraslado));
      docs.sort((a, b) => {
        const at = (a.creadoEn as { toDate?: () => Date }).toDate?.()?.getTime() ?? 0;
        const bt = (b.creadoEn as { toDate?: () => Date }).toDate?.()?.getTime() ?? 0;
        return bt - at;
      });
      setTraslados(docs);
    });
  }, [user]);

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-900">
            <ArrowRightLeft size={17} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Mis traslados</h1>
        </div>
        <Link href="/medico/traslados/nueva"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Nueva solicitud
        </Link>
      </div>

      <div className="space-y-2">
        {traslados.length === 0 && (
          <p className="text-sm text-slate-500 py-10 text-center">No has enviado solicitudes de traslado.</p>
        )}
        {traslados.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t.pacienteNombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">Exp. {t.pacienteExpediente}</p>
                <p className="text-xs text-slate-500 mt-1">{t.servicioOrigen} / Cama {t.camaOrigen} → {t.servicioDestino} / Cama {t.camaDestino}</p>
                <p className="text-xs text-slate-500 mt-1">{formatFecha(t.creadoEn)}</p>
                {t.notasEsdomed && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                    ESDOMED: {t.notasEsdomed}
                  </p>
                )}
              </div>
              <Badge estado={t.estado} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
