"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

export default function NuevaTrasladoPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pacienteNombre: "", pacienteExpediente: "",
    servicioOrigen: "", camaOrigen: "",
    servicioDestino: "", camaDestino: "",
    motivoTraslado: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    const now = Timestamp.now();
    await addDoc(collection(db, "traslados"), {
      ...form, medicoId: user.uid, medicoNombre: profile.nombre,
      medicoServicio: profile.servicio ?? "", estado: "pendiente",
      creadoEn: now, actualizadoEn: now,
    });
    router.replace("/medico/traslados");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors">
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Nueva solicitud de traslado</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
        <Section title="Datos del paciente">
          <Field label="Nombre completo" value={form.pacienteNombre} onChange={set("pacienteNombre")} required />
          <Field label="Número de expediente" value={form.pacienteExpediente} onChange={set("pacienteExpediente")} required />
        </Section>

        <div className="h-px bg-slate-200 dark:bg-slate-800" />

        <Section title="Traslado">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Servicio origen" value={form.servicioOrigen} onChange={set("servicioOrigen")} required />
            <Field label="Cama origen" value={form.camaOrigen} onChange={set("camaOrigen")} required />
            <Field label="Servicio destino" value={form.servicioDestino} onChange={set("servicioDestino")} required />
            <Field label="Cama destino" value={form.camaDestino} onChange={set("camaDestino")} required />
          </div>
        </Section>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Motivo del traslado</label>
          <textarea value={form.motivoTraslado} onChange={set("motivoTraslado")} required rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Describe el motivo clínico del traslado..." />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all active:scale-[0.99]">
          {saving ? "Enviando solicitud..." : "Enviar solicitud"}
        </button>
      </form>
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
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={onChange} required={required} className={inputCls} />
    </div>
  );
}
