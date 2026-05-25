"use client";

import type { CondicionEgresoIncapacidad } from "@/types";
import {
  calcularFechaHasta, formatFechaCorta,
} from "@/lib/incapacidades/helpers";

const inputCls =
  "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm";

const labelCls = "block text-xs font-medium text-slate-500 mb-1.5";

const textareaCls = `${inputCls} min-h-[80px] resize-y`;

export interface IncapacidadFormValue {
  fechaAlta: string;         // YYYY-MM-DD
  diasIncapacidad: string;
  fechaDesde: string;        // YYYY-MM-DD
  diagnosticoEgreso: string;
  tratamientoAlta: string;
  condicionEgreso: CondicionEgresoIncapacidad;
  recomendaciones: string;
  seguimiento: string;
}

interface Props {
  value: IncapacidadFormValue;
  onChange: (next: IncapacidadFormValue) => void;
  disabled?: boolean;
}

export function IncapacidadFormFields({ value, onChange, disabled }: Props) {
  const set = <K extends keyof IncapacidadFormValue>(k: K, v: IncapacidadFormValue[K]) =>
    onChange({ ...value, [k]: v });

  const dias = parseInt(value.diasIncapacidad, 10);
  const fechaHasta = !isNaN(dias) && dias > 0 && value.fechaDesde
    ? calcularFechaHasta(new Date(value.fechaDesde), dias)
    : null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 font-heading">
        Datos de la incapacidad
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Fecha de alta *</label>
          <input
            type="date"
            value={value.fechaAlta}
            onChange={(e) => {
              const nueva = e.target.value;
              // Si fechaDesde estaba vacía o coincidía con la antigua fecha de alta, sincronizar
              const next: IncapacidadFormValue = {
                ...value,
                fechaAlta: nueva,
                fechaDesde: !value.fechaDesde || value.fechaDesde === value.fechaAlta
                  ? nueva
                  : value.fechaDesde,
              };
              onChange(next);
            }}
            disabled={disabled}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Días de incapacidad *</label>
          <input
            type="number"
            min="1"
            max="365"
            value={value.diasIncapacidad}
            onChange={(e) => set("diasIncapacidad", e.target.value)}
            disabled={disabled}
            className={inputCls}
            placeholder="Ej: 7"
          />
        </div>
        <div>
          <label className={labelCls}>Condición de egreso</label>
          <select
            value={value.condicionEgreso}
            onChange={(e) => set("condicionEgreso", e.target.value as CondicionEgresoIncapacidad)}
            disabled={disabled}
            className={inputCls}
          >
            <option value="vivo">Vivo</option>
            <option value="muerto">Muerto</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Desde *</label>
          <input
            type="date"
            value={value.fechaDesde}
            onChange={(e) => set("fechaDesde", e.target.value)}
            disabled={disabled}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Hasta (calculado)</label>
          <input
            type="text"
            value={fechaHasta ? formatFechaCorta(fechaHasta) : ""}
            disabled
            className={`${inputCls} bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed`}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Diagnóstico de egreso *</label>
        <textarea
          value={value.diagnosticoEgreso}
          onChange={(e) => set("diagnosticoEgreso", e.target.value)}
          disabled={disabled}
          className={textareaCls}
          placeholder='Ej: "P1. Bloqueo AV completo resuelto post retiro de marcapasos temporal P2. DM2..."'
        />
      </div>

      <div>
        <label className={labelCls}>Tratamiento al alta *</label>
        <textarea
          value={value.tratamientoAlta}
          onChange={(e) => set("tratamientoAlta", e.target.value)}
          disabled={disabled}
          className={textareaCls}
          placeholder="Lista de medicamentos, referencias, citas..."
        />
      </div>

      <div>
        <label className={labelCls}>Recomendaciones (opcional)</label>
        <textarea
          value={value.recomendaciones}
          onChange={(e) => set("recomendaciones", e.target.value)}
          disabled={disabled}
          className={textareaCls}
        />
      </div>

      <div>
        <label className={labelCls}>Seguimiento (opcional)</label>
        <textarea
          value={value.seguimiento}
          onChange={(e) => set("seguimiento", e.target.value)}
          disabled={disabled}
          className={textareaCls}
          placeholder="Establecimiento, Monitoreo telefónico, Otros..."
        />
      </div>
    </section>
  );
}
