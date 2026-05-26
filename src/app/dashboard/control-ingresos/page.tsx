"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { SERVICIOS_HOSPITALARIOS } from "@/lib/servicios";
import { useAuth } from "@/contexts/AuthContext";

type ControlIngresoForm = {
  expediente: string;
  dui: string;
  apellidos: string;
  nombres: string;
  servicio: string;
  ingresoDirectoServicio: boolean;
};

const inputCls =
  "w-full rounded-md border border-white/10 bg-[#303030] px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-400 shadow-inner outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-600/60";

const selectCls = `${inputCls} appearance-none pr-10 cursor-pointer`;

const emptyForm = (): ControlIngresoForm => ({
  expediente: "",
  dui: "",
  apellidos: "",
  nombres: "",
  servicio: "",
  ingresoDirectoServicio: false,
});

export default function ControlIngresosPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [form, setForm] = useState<ControlIngresoForm>(() => emptyForm());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "esdomed") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  if (!profile || profile.role !== "esdomed") {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const setField = <K extends keyof ControlIngresoForm>(field: K, value: ControlIngresoForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const limpiar = () => {
    setForm(emptyForm());
    setError(null);
    setMensaje(null);
  };

  const validar = () => {
    if (!form.expediente.trim()) return "El numero de expediente es obligatorio.";
    if (!form.apellidos.trim()) return "Los apellidos son obligatorios.";
    if (!form.nombres.trim()) return "Los nombres son obligatorios.";
    if (!form.servicio.trim()) return "Seleccione el servicio.";
    return null;
  };

  const registrar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validar();
    if (validationError) {
      setError(validationError);
      setMensaje(null);
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);

    try {
      const doc: Record<string, unknown> = {
        expediente: form.expediente.trim(),
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        servicio: form.servicio,
        responsableIngresoUid: profile.uid,
        responsableIngresoNombre: profile.nombre,
        ingresoDirectoServicio: form.ingresoDirectoServicio,
        creadoPor: profile.uid,
        creadoPorNombre: profile.nombre,
        creadoEn: Timestamp.now(),
      };

      if (form.dui.trim()) doc.dui = form.dui.trim();

      await addDoc(collection(db, "control_ingresos"), doc);
      setForm(emptyForm());
      setMensaje("Ingreso registrado correctamente.");
    } catch (e) {
      setError(`Error al registrar: ${e instanceof Error ? e.message : "desconocido"}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-full bg-[#182635] text-white">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-7 md:px-6 md:py-8">
        <header className="text-center">
          <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-white md:text-3xl">
            Control General de Ingresos ESDOMED
          </h1>
          <div className="mt-3 h-px w-full bg-[#b48480]" />
          <div className="mx-auto mt-7 flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-white/90 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)]">
            <span className="text-[9px] font-bold uppercase tracking-[0.22em]">Hospital Nacional</span>
            <span className="mt-1 text-sm font-extrabold uppercase tracking-wide">ESDOMED</span>
            <div className="mt-2 flex h-9 items-end gap-1.5">
              <span className="h-3 w-2 rounded-sm bg-white" />
              <span className="h-5 w-2 rounded-sm bg-white" />
              <span className="h-7 w-2 rounded-sm bg-white" />
              <span className="h-4 w-2 rounded-sm bg-white" />
            </div>
            <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em]">Estadisticas medicas</span>
          </div>
        </header>

        <main className="mt-7 rounded-lg bg-[#070d12] p-5 shadow-2xl shadow-black/35 md:p-7">
          <form onSubmit={registrar} className="space-y-7">
            <div>
              <h2 className="text-lg font-bold text-blue-600">Datos de ingreso:</h2>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              <Field label="Numero de Expediente">
                <input
                  type="text"
                  value={form.expediente}
                  onChange={(e) => setField("expediente", e.target.value)}
                  className={inputCls}
                  placeholder="Ej: 123-25"
                  autoComplete="off"
                />
              </Field>

              <Field label="Numero de DUI">
                <input
                  type="text"
                  value={form.dui}
                  onChange={(e) => setField("dui", e.target.value)}
                  className={inputCls}
                  placeholder="Ej: 12345678-9"
                  autoComplete="off"
                />
              </Field>

              <Field label="Apellidos">
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => setField("apellidos", e.target.value)}
                  className={inputCls}
                  placeholder="Apellidos completos"
                  autoComplete="off"
                />
              </Field>

              <Field label="Nombres">
                <input
                  type="text"
                  value={form.nombres}
                  onChange={(e) => setField("nombres", e.target.value)}
                  className={inputCls}
                  placeholder="Nombres completos"
                  autoComplete="off"
                />
              </Field>

              <Field label="Servicio">
                <SelectWrapper>
                  <select
                    value={form.servicio}
                    onChange={(e) => setField("servicio", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Seleccione el servicio</option>
                    {SERVICIOS_HOSPITALARIOS.map((servicio) => (
                      <option key={servicio} value={servicio}>
                        {servicio}
                      </option>
                    ))}
                  </select>
                </SelectWrapper>
              </Field>

              <Field label="Responsable de ingreso ESDOMED">
                <SelectWrapper>
                  <select
                    value={profile.uid}
                    onChange={() => undefined}
                    className={selectCls}
                  >
                    <option value={profile.uid}>{profile.nombre}</option>
                  </select>
                </SelectWrapper>
              </Field>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-bold text-zinc-100">
              <input
                type="checkbox"
                checked={form.ingresoDirectoServicio}
                onChange={(e) => setField("ingresoDirectoServicio", e.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-white accent-blue-600"
              />
              El paciente ingreso directamente a un servicio hospitalario
            </label>

            {(error || mensaje) && (
              <div
                className={`rounded-md border px-4 py-3 text-sm font-semibold ${
                  error
                    ? "border-red-500/40 bg-red-950/45 text-red-200"
                    : "border-emerald-500/40 bg-emerald-950/45 text-emerald-200"
                }`}
              >
                {error ?? mensaje}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-2">
              <button
                type="button"
                onClick={limpiar}
                disabled={guardando}
                className="rounded-md bg-slate-400 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="rounded-md bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </form>
        </main>

        <footer className="mt-auto pt-6 text-center text-xs text-zinc-300">
          Powered by: <span className="font-bold text-white">ESDOMED</span> | Ver 1.0 | © 2025 Estadisticas y Documentos Medicos - HNES
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-100">{label}</span>
      {children}
    </label>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300" />
    </div>
  );
}
