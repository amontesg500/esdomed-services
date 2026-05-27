"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import type { SolicitudAnexo5 } from "@/types";

export default function ImprimirAnexo5Page() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<SolicitudAnexo5 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "anexo5", id)).then((d) => {
      if (d.exists()) {
        setData({ id: d.id, ...d.data() } as SolicitudAnexo5);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  if (loading) return <div className="p-10 text-center">Cargando datos para impresión...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Documento no encontrado</div>;

  return (
    <div className="bg-white min-h-screen text-black" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Ocultar UI extra al imprimir usando print-exacta de CSS si se configuró en index.css, pero Tailwind prose es suficiente */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 15mm; size: letter; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
        }
      `}} />

      <div className="max-w-[800px] mx-auto pt-10 px-8">
        <div className="text-center space-y-5 mb-10">
          <h1 className="text-2xl font-bold">Anexo 5</h1>
          
          <div className="flex items-center justify-center mt-6">
            <img src="/logo_minsal.png" alt="Logo MINSAL" className="w-52 object-contain" />
          </div>
          
          <div className="text-sm space-y-1 mt-6">
            <p className="font-bold text-base">Ministerio de Salud</p>
            <p>Dirección Nacional de Hospitales</p>
            <p>Dirección Nacional de Primer Nivel de Atención</p>
          </div>
        </div>

        <hr className="border-black mb-8 border-t-2" />

        <div className="text-center mb-10 space-y-4">
          <h2 className="font-bold text-lg">Comprobante para el paciente referido en el SIS</h2>
        </div>

        {/* Segundo bloque de títulos interno similar al PDF de ejemplo */}
        <div className="border border-black p-10">
          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center">
              <img src="/logo_minsal.png" alt="Logo MINSAL" className="w-48 object-contain" />
            </div>
            <h3 className="font-bold text-lg mt-6">Referencia en SIS</h3>
            <p className="font-bold">Comprobante para el paciente referido</p>
          </div>

          <hr className="border-black mb-8 border-t-2" />

          <div className="space-y-8 text-sm">
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">Fecha</span>
              <span className="w-[65%] text-base">{data.fecha}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">1. Nombre</span>
              <span className="w-[65%] text-base">{data.nombrePaciente}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">2. Referido de</span>
              <span className="w-[65%] text-base">{data.referidoDe}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">3. Establecimiento de referencia</span>
              <span className="w-[65%] text-base">{data.establecimientoReferencia}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">4. Fecha y hora de la cita</span>
              <span className="w-[65%] text-base">{data.fechaHoraCita || ""}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">5. Especialidad</span>
              <span className="w-[65%] text-base">{data.especialidad}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">6. Médico</span>
              <span className="w-[65%] text-base">{data.medicoRefiere}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1">
              <span className="font-bold w-[35%]">7. Establecimiento que refiere :</span>
              <span className="w-[65%] text-base">{data.establecimientoQueRefiere}</span>
            </div>
            
            <div className="flex justify-between pt-10">
              <div className="flex-1 pr-10">
                <span className="font-bold block mb-1">Teléfono del establecimiento que refiere:</span>
                <div className="border-b border-black w-full pb-1 text-base">
                  {data.telefonoEstablecimiento}
                </div>
              </div>
              <div className="w-40 flex flex-col items-center justify-end">
                <div className="w-full border-b border-black h-8 mb-1"></div>
                <span className="font-bold">Sello</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Controles para cuando no imprime (debugging o si el usuario cancela la impresión) */}
      <div className="no-print fixed bottom-10 right-10 flex gap-4">
        <button 
          onClick={() => window.close()} 
          className="px-6 py-2 bg-slate-200 text-slate-800 font-bold rounded shadow hover:bg-slate-300"
        >
          Cerrar
        </button>
        <button 
          onClick={() => window.print()} 
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
        >
          Imprimir nuevamente
        </button>
      </div>
    </div>
  );
}
