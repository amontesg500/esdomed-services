"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SolicitudAnexo5 } from "@/types";

const inputCls =
  "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm";

export default function NuevaAnexo5Page() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const hoy = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    fecha: hoy,
    nombrePaciente: "",
    referidoDe: "",
    establecimientoReferencia: "",
    fechaHoraCita: "",
    especialidad: "",
    medicoRefiere: "",
    establecimientoQueRefiere: "HOSPITAL NACIONAL EL SALVADOR",
    telefonoEstablecimiento: "7788-5522, 2594-2100, 2594-2139",
  });

  const [guardando, setGuardando] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ tipo: "exito" | "error", mensaje: string } | null>(null);

  useEffect(() => {
    if (profile?.nombre && !form.medicoRefiere) {
      setForm((prev) => ({ ...prev, medicoRefiere: profile.nombre }));
    }
  }, [profile]);

  const guardar = async () => {
    if (!user || !profile) return;
    
    // Validaciones
    if (!form.nombrePaciente.trim()) { setModalInfo({ tipo: "error", mensaje: "El nombre del paciente es obligatorio." }); return; }
    if (!form.referidoDe.trim()) { setModalInfo({ tipo: "error", mensaje: "El campo 'Referido de' es obligatorio." }); return; }
    if (!form.establecimientoReferencia.trim()) { setModalInfo({ tipo: "error", mensaje: "El establecimiento de referencia es obligatorio." }); return; }
    if (!form.especialidad.trim()) { setModalInfo({ tipo: "error", mensaje: "La especialidad es obligatoria." }); return; }

    setModalInfo(null);
    setGuardando(true);

    try {
      const docData: SolicitudAnexo5 = {
        medicoId: user.uid,
        medicoNombre: profile.nombre,
        
        fecha: form.fecha,
        nombrePaciente: form.nombrePaciente.toUpperCase(),
        referidoDe: form.referidoDe.toUpperCase(),
        establecimientoReferencia: form.establecimientoReferencia.toUpperCase(),
        fechaHoraCita: form.fechaHoraCita || undefined,
        especialidad: form.especialidad.toUpperCase(),
        medicoRefiere: form.medicoRefiere.toUpperCase(),
        establecimientoQueRefiere: form.establecimientoQueRefiere.toUpperCase(),
        telefonoEstablecimiento: form.telefonoEstablecimiento,

        estado: "pendiente",
        creadoEn: Timestamp.now() as unknown as Date,
      };

      await addDoc(collection(db, "anexo5"), docData);
      setModalInfo({ tipo: "exito", mensaje: "Referencia de Anexo 5 registrada correctamente." });
    } catch (e) {
      setModalInfo({ tipo: "error", mensaje: `Error al guardar: ${e instanceof Error ? e.message : "Desconocido"}` });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {modalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className={`p-6 flex flex-col items-center gap-3 ${modalInfo.tipo === "exito" ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
              {modalInfo.tipo === "exito" ? (
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 size={36} className="text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertTriangle size={36} className="text-red-600 dark:text-red-400" />
                </div>
              )}
              <h3 className={`text-lg font-bold ${modalInfo.tipo === "exito" ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                {modalInfo.tipo === "exito" ? "Referencia registrada" : "No se pudo guardar"}
              </h3>
              <p className={`text-sm text-center ${modalInfo.tipo === "exito" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                {modalInfo.mensaje}
              </p>
            </div>
            <div className="p-5 space-y-2">
              {modalInfo.tipo === "exito" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        fecha: hoy,
                        nombrePaciente: "",
                        referidoDe: "",
                        establecimientoReferencia: "",
                        fechaHoraCita: "",
                        especialidad: "",
                        medicoRefiere: profile?.nombre || "",
                        establecimientoQueRefiere: "HOSPITAL NACIONAL EL SALVADOR",
                        telefonoEstablecimiento: "7788-5522, 2594-2100, 2594-2139",
                      });
                      setModalInfo(null);
                    }}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Registrar otra referencia
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/medico")}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Volver al inicio
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalInfo(null)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/medico"
              className="p-1.5 -ml-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">
              Nuevo Anexo 5
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Comprobante para el paciente referido en el SIS
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Registro de referencia (Médico)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha</label>
            <input
              type="date"
              className={inputCls}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">1. Nombre del paciente</label>
            <input
              type="text"
              className={inputCls}
              value={form.nombrePaciente}
              onChange={(e) => setForm({ ...form, nombrePaciente: e.target.value })}
              placeholder="Ej. MARIA ESTHER MONTES MORALES"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">2. Referido de</label>
            <input
              type="text"
              className={inputCls}
              value={form.referidoDe}
              onChange={(e) => setForm({ ...form, referidoDe: e.target.value })}
              placeholder="Ej. DEMANDA ESPONTANEA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">3. Establecimiento de referencia</label>
            <input
              type="text"
              className={inputCls}
              value={form.establecimientoReferencia}
              onChange={(e) => setForm({ ...form, establecimientoReferencia: e.target.value })}
              placeholder="Ej. Hospital Nacional Zacamil"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">3. Fecha y hora de la cita (opcional)</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.fechaHoraCita}
              onChange={(e) => setForm({ ...form, fechaHoraCita: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">4. Especialidad</label>
            <input
              type="text"
              className={inputCls}
              value={form.especialidad}
              onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
              placeholder="Ej. CIRUGÍA GENERAL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">5. Médico que refiere</label>
            <input
              type="text"
              className={inputCls}
              value={form.medicoRefiere}
              onChange={(e) => setForm({ ...form, medicoRefiere: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">6. Establecimiento que refiere</label>
            <input
              type="text"
              className={inputCls}
              value={form.establecimientoQueRefiere}
              onChange={(e) => setForm({ ...form, establecimientoQueRefiere: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono del establecimiento que refiere</label>
            <input
              type="text"
              className={inputCls}
              value={form.telefonoEstablecimiento}
              onChange={(e) => setForm({ ...form, telefonoEstablecimiento: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setForm({
                fecha: hoy,
                nombrePaciente: "",
                referidoDe: "",
                establecimientoReferencia: "",
                fechaHoraCita: "",
                especialidad: "",
                medicoRefiere: profile?.nombre || "",
                establecimientoQueRefiere: "HOSPITAL NACIONAL EL SALVADOR",
                telefonoEstablecimiento: "7788-5522, 2594-2100, 2594-2139",
              });
              setModalInfo(null);
            }}
            disabled={guardando}
            className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Limpiar
          </button>
          
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save size={16} />
            {guardando ? "Guardando..." : "Guardar referencia"}
          </button>
        </div>
      </div>
    </div>
  );
}
