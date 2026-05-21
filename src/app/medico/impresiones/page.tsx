"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { SolicitudImpresion } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Printer, Plus, Upload } from "lucide-react";

const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

export default function MedicoImpresionesPage() {
  const { user, profile } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudImpresion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [copias, setCopias] = useState("1");
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "solicitudes_impresion"), where("medicoId", "==", user.uid), orderBy("creadoEn", "desc"));
    return onSnapshot(q, s => setSolicitudes(s.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudImpresion))));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !profile) return;
    setSaving(true);
    const storageRef = ref(storage, `impresiones/${user.uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on("state_changed",
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setSaving(false),
      async () => {
        const pdfUrl = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "solicitudes_impresion"), {
          medicoId: user.uid, medicoNombre: profile.nombre,
          medicoServicio: profile.servicio ?? "",
          descripcion, copias: parseInt(copias), pdfUrl,
          pdfNombre: file.name, estado: "pendiente", creadoEn: Timestamp.now(),
        });
        setShowForm(false); setFile(null); setDescripcion(""); setCopias("1");
        setProgress(null); setSaving(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    );
  };

  const formatFecha = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleString("es-HN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950 rounded-xl flex items-center justify-center border border-violet-200 dark:border-violet-900">
            <Printer size={17} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">Solicitudes de impresión</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? "Cancelar" : <><Plus size={15} /> Nueva solicitud</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Descripción del documento</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} required
              placeholder="Ej: Resumen médico de egreso - Paciente Juan Pérez" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Número de copias</label>
              <input type="number" min="1" max="20" value={copias} onChange={e => setCopias(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Archivo PDF</label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
                <Upload size={14} className="text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{file ? file.name : "Seleccionar PDF"}</span>
                <input ref={fileRef} type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} required className="sr-only" />
              </label>
            </div>
          </div>

          {progress !== null && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Subiendo...</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={saving || !file}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all active:scale-[0.99]">
            {saving ? `Subiendo... ${progress ?? 0}%` : "Enviar solicitud"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {solicitudes.length === 0 && (
          <p className="text-sm text-slate-500 py-10 text-center">No has enviado solicitudes de impresión.</p>
        )}
        {solicitudes.map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-900 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{s.descripcion}</p>
                  <Badge estado={s.estado} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{s.copias} copia(s) · {s.pdfNombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatFecha(s.creadoEn)}</p>
                {s.estado === "impreso" && s.impresoPorNombre && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">Impreso por {s.impresoPorNombre} · {formatFecha(s.impresoEn)}</p>
                )}
              </div>
              <a href={s.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 shrink-0 transition-colors">
                Ver PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
