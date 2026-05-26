"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, Timestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { SERVICIOS_HOSPITALARIOS } from "@/lib/servicios";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardList, CheckCircle2, Search, X } from "lucide-react";

type ControlIngreso = {
  id?: string;
  expediente: string;
  dui?: string;
  apellidos: string;
  nombres: string;
  servicio: string;
  ingresoDirectoServicio: boolean;
  responsableIngresoNombre: string;
  creadoEn: Date;
};

type FormState = {
  expediente: string;
  dui: string;
  apellidos: string;
  nombres: string;
  servicio: string;
  ingresoDirectoServicio: boolean;
};

const inputCls =
  "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

const emptyForm = (): FormState => ({
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
  const [form, setForm] = useState<FormState>(emptyForm());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [ingresos, setIngresos] = useState<ControlIngreso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "esdomed") router.replace("/dashboard");
  }, [profile, router]);

  useEffect(() => {
    const q = query(collection(db, "control_ingresos"), orderBy("creadoEn", "desc"));
    return onSnapshot(q, s =>
      setIngresos(s.docs.map(d => ({ id: d.id, ...d.data() } as ControlIngreso)))
    );
  }, []);

  if (!profile || profile.role !== "esdomed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validar = (): string | null => {
    if (!form.expediente.trim()) return "El número de expediente es obligatorio.";
    if (!form.apellidos.trim()) return "Los apellidos son obligatorios.";
    if (!form.nombres.trim()) return "Los nombres son obligatorios.";
    if (!form.servicio.trim()) return "Seleccione el servicio.";
    return null;
  };

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) { setError(err); return; }
    setGuardando(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {
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
      if (form.dui.trim()) data.dui = form.dui.trim();
      await addDoc(collection(db, "control_ingresos"), data);
      setForm(emptyForm());
      setExito(true);
      setTimeout(() => setExito(false), 3500);
    } catch (err) {
      setError(`Error al registrar: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setGuardando(false);
    }
  };

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = ((ts as unknown) as { toDate?: () => Date }).toDate?.() ?? (ts as Date);
    return d.toLocaleString("es-HN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const lista = ingresos.filter(i => {
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const enExp = (i.expediente?.toLowerCase() ?? "").includes(q);
      const enApe = (i.apellidos?.toLowerCase() ?? "").includes(q);
      const enNom = (i.nombres?.toLowerCase() ?? "").includes(q);
      if (!enExp && !enApe && !enNom) return false;
    }
    if (fechaDesde || fechaHasta) {
      const d = ((i.creadoEn as unknown) as { toDate?: () => Date }).toDate?.() ?? i.creadoEn;
      if (fechaDesde && d < new Date(fechaDesde + "T00:00:00")) return false;
      if (fechaHasta && d > new Date(fechaHasta + "T23:59:59")) return false;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950 rounded-xl flex items-center justify-center border border-teal-200 dark:border-teal-900 flex-shrink-0">
          <ClipboardList size={17} className="text-teal-600 dark:text-teal-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading leading-tight">
            Control de Ingresos
          </h1>
          <p className="text-xs text-slate-500">{ingresos.length} registro(s) en total</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-6">

        {/* Card header */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Image
            src="/logoEsdomed.png"
            alt="Logo ESDOMED"
            width={44}
            height={44}
            className="object-contain rounded-lg flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-heading">Nuevo ingreso</p>
            <p className="text-xs text-slate-500 truncate">Responsable: {profile.nombre}</p>
          </div>
        </div>

        <form onSubmit={registrar} className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Número de expediente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.expediente}
                onChange={set("expediente")}
                placeholder="Ej: 123-25"
                className={inputCls}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Número de DUI{" "}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.dui}
                onChange={set("dui")}
                placeholder="Ej: 12345678-9"
                className={inputCls}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.apellidos}
                onChange={set("apellidos")}
                placeholder="Apellidos completos"
                className={inputCls}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nombres}
                onChange={set("nombres")}
                placeholder="Nombres completos"
                className={inputCls}
                autoComplete="off"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Servicio <span className="text-red-500">*</span>
              </label>
              <select
                value={form.servicio}
                onChange={set("servicio")}
                className={`${inputCls} appearance-none`}
              >
                <option value="">Seleccione el servicio...</option>
                {SERVICIOS_HOSPITALARIOS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ingresoDirectoServicio}
              onChange={e => setForm(prev => ({ ...prev, ingresoDirectoServicio: e.target.checked }))}
              className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              El paciente ingresó directamente a un servicio hospitalario
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {exito && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              Ingreso registrado correctamente.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setForm(emptyForm()); setError(null); }}
              disabled={guardando}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {guardando ? "Registrando..." : "Registrar ingreso"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de registros */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Registros ({lista.length})
        </p>

        {/* Barra de búsqueda y fechas */}
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Expediente o nombre..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0">Desde</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0">Hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          {(busqueda || fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setBusqueda(""); setFechaDesde(""); setFechaHasta(""); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        <div className="space-y-2">
          {lista.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">
              {ingresos.length === 0
                ? "No hay ingresos registrados aún."
                : "Sin resultados para los filtros aplicados."}
            </p>
          )}
          {lista.map(ingreso => (
            <div
              key={ingreso.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm font-mono">
                    Exp. {ingreso.expediente}
                  </span>
                  {ingreso.ingresoDirectoServicio && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                      Directo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                  {ingreso.apellidos}, {ingreso.nombres}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{ingreso.servicio}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">{formatFecha(ingreso.creadoEn)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{ingreso.responsableIngresoNombre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
