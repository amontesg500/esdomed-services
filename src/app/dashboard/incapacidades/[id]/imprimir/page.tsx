"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Printer } from "lucide-react";
import type { Paciente, SolicitudIncapacidad } from "@/types";
import { toDate } from "@/lib/pacientes/helpers";
import { ConstanciaPrintLayout } from "@/components/incapacidades/ConstanciaPrintLayout";

export default function ImprimirIncapacidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [incapacidad, setIncapacidad] = useState<SolicitudIncapacidad | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const incSnap = await getDoc(doc(db, "incapacidades", id));
        if (cancelado) return;
        if (!incSnap.exists()) {
          setError("Solicitud no encontrada");
          setLoading(false);
          return;
        }
        const incData = incSnap.data();
        const inc: SolicitudIncapacidad = {
          id: incSnap.id,
          ...incData,
          fechaAlta: toDate(incData.fechaAlta) ?? new Date(),
          fechaDesde: toDate(incData.fechaDesde) ?? new Date(),
          fechaHasta: toDate(incData.fechaHasta) ?? new Date(),
          creadoEn: toDate(incData.creadoEn) ?? new Date(),
          emitidaEn: toDate(incData.emitidaEn),
          fechaExpedicion: toDate(incData.fechaExpedicion),
        } as SolicitudIncapacidad;
        setIncapacidad(inc);

        const pacSnap = await getDoc(doc(db, "pacientes", inc.pacienteId));
        if (cancelado) return;
        if (pacSnap.exists()) {
          const pacData = pacSnap.data();
          setPaciente({
            id: pacSnap.id,
            ...pacData,
            fechaIngreso: toDate(pacData.fechaIngreso) ?? new Date(),
            fechaEgreso: toDate(pacData.fechaEgreso),
            fechaNacimiento: toDate(pacData.fechaNacimiento),
            creadoEn: toDate(pacData.creadoEn) ?? new Date(),
          } as Paciente);
        } else {
          // Paciente no existe — construir uno mínimo desde el snapshot de la incapacidad
          const [apellidos = "", ...nombresParts] = inc.pacienteNombre.split(" ");
          setPaciente({
            id: inc.pacienteId,
            expediente: inc.pacienteExpediente,
            apellidos,
            nombres: nombresParts.join(" "),
            genero: "otro",
            fechaIngreso: new Date(),
            servicioIngreso: inc.servicioPaciente,
            servicioActual: inc.servicioPaciente,
            camaActual: inc.camaPaciente,
            estado: "activo",
            creadoEn: new Date(),
            creadoPor: "",
            creadoPorNombre: "",
          } as Paciente);
        }
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
        setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !incapacidad || !paciente) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
        <p className="text-sm text-slate-500 mb-3">{error ?? "No se pudo cargar la constancia"}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-200 overflow-y-auto print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Toolbar — oculto al imprimir */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} />
            Volver
          </button>
          <p className="text-xs text-slate-500">
            Vista previa de la constancia
          </p>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Printer size={14} />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Constancia en hoja blanca */}
      <div className="py-6 px-4 print:p-0">
        <div className="bg-white shadow-lg max-w-[21cm] mx-auto print:shadow-none print:max-w-none">
          <ConstanciaPrintLayout incapacidad={incapacidad} paciente={paciente} />
        </div>
      </div>

      {/* CSS global para impresión: oculta sidebar y barras del dashboard */}
      <style jsx global>{`
        @media print {
          aside,
          .md\\:hidden,
          [class*="border-r border-slate-200"][class*="dark:border-slate-800"],
          [class*="md:hidden fixed top-0"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            overflow: visible !important;
          }
          html, body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
