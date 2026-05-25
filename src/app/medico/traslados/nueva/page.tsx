"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ArrowRight, ArrowLeft, ArrowRightLeft, RefreshCw, Building2, User, FileText } from "lucide-react";
import { SERVICIOS_HOSPITALARIOS } from "@/lib/servicios";

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

type TipoTraslado = "servicio_cama" | "interno" | "intercambio" | "";

export default function NuevaTrasladoPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [tipoTraslado, setTipoTraslado] = useState<TipoTraslado>("");
  
  const [form, setForm] = useState({
    pacienteNombre: "", pacienteExpediente: "",
    pacienteBNombre: "", pacienteBExpediente: "",
    servicioOrigen: "", camaOrigen: "",
    servicioDestino: "", camaDestino: "",
    motivoTraslado: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // Validaciones por paso
  const canGoNext = () => {
    if (step === 1) return tipoTraslado !== "";
    if (step === 2) {
      if (tipoTraslado === "servicio_cama") return form.servicioOrigen && form.camaOrigen && form.servicioDestino && form.camaDestino;
      if (tipoTraslado === "interno") return form.servicioOrigen && form.camaOrigen && form.camaDestino;
      if (tipoTraslado === "intercambio") return form.servicioOrigen && form.camaOrigen && form.servicioDestino && form.camaDestino;
    }
    if (step === 3) {
      if (tipoTraslado === "intercambio") return form.pacienteExpediente && form.pacienteBExpediente;
      return form.pacienteExpediente;
    }
    if (step === 4) {
      return form.motivoTraslado.trim().length > 0;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !canGoNext() || !form.motivoTraslado) return;
    setSaving(true);
    const now = Timestamp.now();
    
    // Preparar el payload
    const payload: any = {
      tipoTraslado,
      medicoId: user.uid,
      medicoNombre: profile.nombre,
      medicoServicio: profile.servicios?.join(" / ") || profile.servicio || "",
      
      pacienteExpediente: form.pacienteExpediente,
      pacienteNombre: form.pacienteNombre,
      
      servicioOrigen: form.servicioOrigen,
      camaOrigen: form.camaOrigen,
      camaDestino: form.camaDestino,
      
      motivoTraslado: form.motivoTraslado,
      estado: "pendiente",
      creadoEn: now,
      actualizadoEn: now,
    };

    if (tipoTraslado === "servicio_cama") {
      payload.servicioDestino = form.servicioDestino;
    } else if (tipoTraslado === "interno") {
      // Destino es el mismo servicio
      payload.servicioDestino = form.servicioOrigen;
    } else if (tipoTraslado === "intercambio") {
      payload.servicioDestino = form.servicioDestino; // Servicio de Paciente B
      payload.pacienteBExpediente = form.pacienteBExpediente;
      payload.pacienteBNombre = form.pacienteBNombre;
    }

    await addDoc(collection(db, "traslados"), payload);
    router.replace("/medico/traslados");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors">
            <ChevronLeft size={16} /> Volver
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-blue-600" : s < step ? "w-4 bg-blue-300 dark:bg-blue-800" : "w-4 bg-slate-200 dark:bg-slate-800"}`} />
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        
        {/* Paso 1: Tipo de Traslado */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading mb-2">¿Qué tipo de traslado deseas solicitar?</h1>
              <p className="text-slate-500 text-sm">Selecciona el tipo de movimiento de camas que necesitas realizar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TypeCard 
                selected={tipoTraslado === "servicio_cama"} 
                onClick={() => setTipoTraslado("servicio_cama")}
                icon={<Building2 size={24} />} 
                title="Servicio a Servicio" 
                desc="Traslado a otro servicio médico diferente." 
              />
              <TypeCard 
                selected={tipoTraslado === "interno"} 
                onClick={() => setTipoTraslado("interno")}
                icon={<ArrowRightLeft size={24} />} 
                title="Traslado Interno" 
                desc="Movimiento dentro del mismo servicio médico." 
              />
              <TypeCard 
                selected={tipoTraslado === "intercambio"} 
                onClick={() => setTipoTraslado("intercambio")}
                icon={<RefreshCw size={24} />} 
                title="Intercambio de Camas" 
                desc="Dos pacientes intercambian sus camas actuales." 
              />
            </div>
          </div>
        )}

        {/* Paso 2: Ubicaciones */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading mb-2">Detalles de Ubicación</h1>
              <p className="text-slate-500 text-sm">Ingresa el origen y destino del traslado.</p>
            </div>

            {tipoTraslado === "servicio_cama" && (
              <div className="space-y-5">
                <Section title="Ubicación Actual (Origen)">
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Servicio origen" value={form.servicioOrigen} onChange={set("servicioOrigen")} required />
                    <Field label="Cama origen" value={form.camaOrigen} onChange={set("camaOrigen")} required />
                  </div>
                </Section>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <Section title="Nueva Ubicación (Destino)">
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Servicio destino" value={form.servicioDestino} onChange={set("servicioDestino")} required />
                    <Field label="Cama destino" value={form.camaDestino} onChange={set("camaDestino")} required />
                  </div>
                </Section>
              </div>
            )}

            {tipoTraslado === "interno" && (
              <div className="space-y-5">
                <Section title="Servicio">
                  <SelectField label="Servicio actual" value={form.servicioOrigen} onChange={set("servicioOrigen")} required />
                </Section>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <Section title="Movimiento de Cama">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cama origen" value={form.camaOrigen} onChange={set("camaOrigen")} required />
                    <Field label="Cama destino" value={form.camaDestino} onChange={set("camaDestino")} required />
                  </div>
                </Section>
              </div>
            )}

            {tipoTraslado === "intercambio" && (
              <div className="space-y-5">
                <Section title="Ubicación Actual de Paciente A">
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Servicio" value={form.servicioOrigen} onChange={set("servicioOrigen")} required />
                    <Field label="Cama" value={form.camaOrigen} onChange={set("camaOrigen")} required />
                  </div>
                </Section>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <Section title="Ubicación Actual de Paciente B">
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Servicio" value={form.servicioDestino} onChange={set("servicioDestino")} required />
                    <Field label="Cama" value={form.camaDestino} onChange={set("camaDestino")} required />
                  </div>
                </Section>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Pacientes */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading mb-2">Datos del Paciente</h1>
              <p className="text-slate-500 text-sm">El número de expediente es obligatorio.</p>
            </div>

            {tipoTraslado === "intercambio" ? (
              <div className="space-y-5">
                <Section title={`Paciente A (Actualmente en Cama ${form.camaOrigen || "-"})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Número de expediente" value={form.pacienteExpediente} onChange={set("pacienteExpediente")} required />
                    <Field label="Nombre (Opcional)" value={form.pacienteNombre} onChange={set("pacienteNombre")} />
                  </div>
                </Section>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <Section title={`Paciente B (Actualmente en Cama ${form.camaDestino || "-"})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Número de expediente" value={form.pacienteBExpediente} onChange={set("pacienteBExpediente")} required />
                    <Field label="Nombre (Opcional)" value={form.pacienteBNombre} onChange={set("pacienteBNombre")} />
                  </div>
                </Section>
              </div>
            ) : (
              <Section title="Paciente a trasladar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Número de expediente" value={form.pacienteExpediente} onChange={set("pacienteExpediente")} required />
                  <Field label="Nombre completo (Opcional)" value={form.pacienteNombre} onChange={set("pacienteNombre")} />
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Paso 4: Motivo y Enviar */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading mb-2">Motivo del Traslado</h1>
              <p className="text-slate-500 text-sm">Brinda la justificación clínica o administrativa del movimiento.</p>
            </div>

            <div>
              <textarea value={form.motivoTraslado} onChange={set("motivoTraslado")} required rows={5}
                className={`${inputCls} resize-none`}
                placeholder="Describe el motivo del traslado aquí..." />
            </div>

            {/* Resumen */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Resumen de la Solicitud</h3>
              
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex gap-2">
                  <span className="font-medium">Tipo:</span> 
                  {tipoTraslado === "servicio_cama" && "Servicio a Servicio"}
                  {tipoTraslado === "interno" && "Traslado Interno"}
                  {tipoTraslado === "intercambio" && "Intercambio de Camas"}
                </div>
                
                {tipoTraslado !== "intercambio" ? (
                  <>
                    <div className="flex gap-2"><span className="font-medium">Expediente:</span> {form.pacienteExpediente} {form.pacienteNombre ? `(${form.pacienteNombre})` : ""}</div>
                    <div className="flex gap-2">
                      <span className="font-medium">Movimiento:</span> 
                      {form.servicioOrigen} (Cama {form.camaOrigen}) → {tipoTraslado === "interno" ? form.servicioOrigen : form.servicioDestino} (Cama {form.camaDestino})
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <span className="font-medium">Paciente A:</span> 
                      Exp. {form.pacienteExpediente} {form.pacienteNombre ? `(${form.pacienteNombre})` : ""} 
                      <span className="text-slate-500 ml-1">[{form.servicioOrigen} - Cama {form.camaOrigen} → Cama {form.camaDestino}]</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium">Paciente B:</span> 
                      Exp. {form.pacienteBExpediente} {form.pacienteBNombre ? `(${form.pacienteBNombre})` : ""} 
                      <span className="text-slate-500 ml-1">[{form.servicioDestino} - Cama {form.camaDestino} → Cama {form.camaOrigen}]</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Controles de Navegación */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
          <button 
            type="button"
            onClick={prevStep}
            disabled={step === 1 || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-0 transition-colors">
            <ArrowLeft size={16} /> Anterior
          </button>

          {step < 4 ? (
            <button 
              type="button"
              onClick={nextStep}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all disabled:cursor-not-allowed">
              Siguiente <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!canGoNext() || !form.motivoTraslado || saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-400 dark:disabled:bg-green-800 text-white text-sm font-semibold rounded-xl transition-all disabled:cursor-not-allowed">
              {saving ? "Enviando..." : "Confirmar y Enviar"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function TypeCard({ selected, onClick, icon, title, desc }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div onClick={onClick}
      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col gap-3
        ${selected 
          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
          : "border-slate-200 dark:border-slate-700 bg-transparent hover:border-blue-300 dark:hover:border-blue-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
      <div className={`${selected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className={`text-xs ${selected ? "text-blue-600/80 dark:text-blue-400/80" : "text-slate-500"}`}>{desc}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, required }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type="text" value={value} onChange={onChange} className={inputCls} />
    </div>
  );
}

function SelectField({ label, value, onChange, required }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <select value={value} onChange={onChange} className={inputCls}>
        <option value="">Seleccionar...</option>
        {SERVICIOS_HOSPITALARIOS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
