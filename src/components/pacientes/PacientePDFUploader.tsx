"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import {
  parsearPDF,
  fusionarCampos,
  type CamposExtraidos,
  type HojaPDF,
} from "@/lib/pacientes/pdfParser";

interface ArchivoProcesado {
  nombre: string;
  tipo: HojaPDF;
  campos: CamposExtraidos;
}

interface PacientePDFUploaderProps {
  onCamposExtraidos: (campos: CamposExtraidos) => void;
}

const TIPO_LABEL: Record<HojaPDF, string> = {
  identificacion: "Hoja de Identificación",
  ingreso_egreso: "Hoja de Ingreso/Egreso",
  desconocido:    "Tipo no reconocido",
};

const TIPO_COLOR: Record<HojaPDF, string> = {
  identificacion: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  ingreso_egreso: "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900",
  desconocido:    "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
};

export function PacientePDFUploader({ onCamposExtraidos }: PacientePDFUploaderProps) {
  const [archivos, setArchivos] = useState<ArchivoProcesado[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const procesarArchivos = async (files: File[]) => {
    setError(null);
    setProcesando(true);
    const procesados: ArchivoProcesado[] = [...archivos];

    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError(`"${file.name}" no es un PDF.`);
        continue;
      }
      try {
        const resultado = await parsearPDF(file);
        procesados.push({
          nombre: file.name,
          tipo: resultado.tipo,
          campos: resultado.campos,
        });
      } catch (err) {
        setError(
          `Error al procesar "${file.name}": ${err instanceof Error ? err.message : "desconocido"}`
        );
      }
    }

    setArchivos(procesados);
    // Fusionar todos los campos en uno solo (Identificación tiene prioridad por tener datos familiares completos)
    const fusion = procesados.reduce<CamposExtraidos>((acc, a) => {
      // Si es identificación, ponerla como base (prioridad alta)
      if (a.tipo === "identificacion") return fusionarCampos(a.campos, acc);
      return fusionarCampos(acc, a.campos);
    }, {});
    onCamposExtraidos(fusion);
    setProcesando(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      procesarArchivos(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      procesarArchivos(Array.from(e.dataTransfer.files));
    }
  };

  const eliminar = (idx: number) => {
    const next = archivos.filter((_, i) => i !== idx);
    setArchivos(next);
    const fusion = next.reduce<CamposExtraidos>((acc, a) => {
      if (a.tipo === "identificacion") return fusionarCampos(a.campos, acc);
      return fusionarCampos(acc, a.campos);
    }, {});
    onCamposExtraidos(fusion);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl px-6 py-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        {procesando ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-sm font-medium">Procesando PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 flex items-center justify-center">
              <Upload size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Arrastra los PDFs aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-500">
              Hoja de Identificación y/o Hoja de Ingreso/Egreso · puedes subir ambas
            </p>
          </div>
        )}
      </div>

      {/* Errores */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de archivos procesados */}
      {archivos.length > 0 && (
        <div className="space-y-2">
          {archivos.map((a, idx) => {
            const cantidadCampos = Object.keys(a.campos).filter(
              (k) => a.campos[k as keyof CamposExtraidos] !== undefined
            ).length;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5"
              >
                <FileText size={16} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {a.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${TIPO_COLOR[a.tipo]}`}
                    >
                      {TIPO_LABEL[a.tipo]}
                    </span>
                    {a.tipo !== "desconocido" && (
                      <span className="flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400">
                        <CheckCircle2 size={11} />
                        {cantidadCampos} campos extraídos
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => eliminar(idx)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors flex-shrink-0"
                  aria-label="Quitar archivo"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
