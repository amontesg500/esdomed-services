import type {
  AreaGeografica,
  CircunstanciaIngreso,
  DiagnosticoCIE,
  Genero,
  ResponsablePaciente,
} from "@/types";
import {
  combinarFechaHora,
  normalizarArea,
  normalizarCircunstancia,
  normalizarGenero,
  parseFechaEs,
} from "./helpers";

export type HojaPDF = "identificacion" | "ingreso_egreso" | "desconocido";

export interface CamposExtraidos {
  expediente?: string;
  apellidos?: string;
  nombres?: string;
  fechaNacimiento?: Date;
  genero?: Genero;
  estadoFamiliar?: string;
  dui?: string;
  numeroAfiliacion?: string;
  ocupacion?: string;
  nacionalidad?: string;
  telefono?: string;
  direccion?: string;
  municipio?: string;
  departamento?: string;
  canton?: string;
  area?: AreaGeografica;
  responsable?: ResponsablePaciente;
  establecimientoProcedencia?: string;
  circunstanciaIngreso?: CircunstanciaIngreso;
  fechaIngreso?: Date;
  servicioIngreso?: string;
  medicoIngresoNombre?: string;
  diagnosticoIngreso?: DiagnosticoCIE;
}

export interface ResultadoParser {
  tipo: HojaPDF;
  campos: CamposExtraidos;
  textoCrudo: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extracción del texto del PDF (lazy import de pdfjs-dist, solo cliente)
// ─────────────────────────────────────────────────────────────────────────────

async function extraerTextoPDF(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("extraerTextoPDF solo funciona en el navegador");
  }
  const pdfjs = await import("pdfjs-dist");
  // Configurar worker. Usamos el .mjs empaquetado por pdfjs-dist.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const partes: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const txt = content.items
      .map((it) => (it as { str?: string }).str ?? "")
      .join(" ");
    partes.push(txt);
  }
  return partes.join(" \n ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de regex
// ─────────────────────────────────────────────────────────────────────────────

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extrae el valor entre `startLabel:` y el siguiente label de `endLabels`.
 * Si no encuentra ningún endLabel, captura hasta fin de cadena.
 */
function extraer(
  texto: string,
  startLabel: string,
  endLabels: string[]
): string | null {
  const ends = endLabels.length
    ? endLabels.map(escapar).join("|")
    : "$$$$NUNCA$$$$";
  const re = new RegExp(
    `${escapar(startLabel)}\\s*:?\\s*([\\s\\S]*?)(?=\\s+(?:${ends})\\s*:|$)`,
    "i"
  );
  const m = texto.match(re);
  if (!m) return null;
  const val = m[1].trim().replace(/\s+/g, " ");
  return val || null;
}

function seccion(texto: string, start: string, end: string): string {
  const startRe = new RegExp(escapar(start), "i");
  const startIdx = texto.search(startRe);
  if (startIdx === -1) return texto;
  const resto = texto.slice(startIdx);
  const endRe = new RegExp(escapar(end), "i");
  const endIdx = resto.search(endRe);
  return endIdx === -1 ? resto : resto.slice(0, endIdx);
}

// ─────────────────────────────────────────────────────────────────────────────
// Detección de tipo de hoja
// ─────────────────────────────────────────────────────────────────────────────

export function detectarTipoHoja(texto: string): HojaPDF {
  if (/FORMULARIO\s+DE\s+IDENTIFICACION/i.test(texto)) return "identificacion";
  if (/FORMULARIO\s+DE\s+INGRESO\s+Y\s+EGRESO/i.test(texto)) return "ingreso_egreso";
  if (/NEC\s*:/i.test(texto) && /DATOS\s+DEL\s+INGRESO/i.test(texto)) {
    return "ingreso_egreso";
  }
  return "desconocido";
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser: Hoja de Identificación
// ─────────────────────────────────────────────────────────────────────────────

function parsearIdentificacion(texto: string): CamposExtraidos {
  const out: CamposExtraidos = {};
  const datosPaciente = seccion(texto, "A. Datos Del Paciente", "B. Datos De La Familia");
  const datosFamilia  = seccion(texto, "B. Datos De La Familia", "C. Datos De Persona");

  // Expediente: "Número Expediente Clínico:22-26"
  const exp = texto.match(/N(?:ú|u)mero\s+Expediente\s+Cl(?:í|i)nico\s*:?\s*([\d\w-]+)/i);
  if (exp) out.expediente = exp[1].trim();

  // DUI del header — "DUI: 03472455-5"
  const dui = texto.match(/DUI\s*:?\s*(\d{8}-\d)/);
  if (dui) out.dui = dui[1];

  const apellidos = extraer(datosPaciente, "Apellidos", ["Nombres", "Conocido Por"]);
  if (apellidos) out.apellidos = limpiarNombre(apellidos);

  const nombres = extraer(datosPaciente, "Nombres", [
    "Conocido Por", "Fecha de Nacimiento", "Fecha Nacimiento",
  ]);
  if (nombres) out.nombres = limpiarNombre(nombres);

  const fechaNac = extraer(datosPaciente, "Fecha de Nacimiento", ["Edad", "Sexo", "Lugar de Nacimiento"]);
  if (fechaNac) {
    const f = parseFechaEs(fechaNac.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)?.[0]);
    if (f) out.fechaNacimiento = f;
  }

  const sexo = extraer(datosPaciente, "Sexo", ["Estado Familiar", "Nacionalidad"]);
  if (sexo) out.genero = normalizarGenero(sexo);

  const estadoFam = extraer(datosPaciente, "Estado Familiar", ["Nacionalidad", "Documento Identidad"]);
  if (estadoFam) out.estadoFamiliar = estadoFam;

  const nacionalidad = extraer(datosPaciente, "Nacionalidad", ["Documento Identidad", "Tel"]);
  if (nacionalidad) out.nacionalidad = nacionalidad;

  const tel = datosPaciente.match(/Tel(?:é|e)fono\s*:?\s*(\d{4}-\d{4})/);
  if (tel) out.telefono = tel[1];

  const ocupacion = extraer(datosPaciente, "Ocupación", ["Dirección", "Lugar Trabajo"]);
  if (ocupacion) out.ocupacion = ocupacion;

  const direccion = extraer(datosPaciente, "Dirección", ["Municipio Domicilio", "Departamento Domicilio"]);
  if (direccion) out.direccion = direccion;

  const municipio = extraer(datosPaciente, "Municipio Domicilio", ["Departamento Domicilio", "Cantón"]);
  if (municipio) out.municipio = municipio;

  const departamento = extraer(datosPaciente, "Departamento Domicilio", ["Cantón", "Área Geográfica"]);
  if (departamento) out.departamento = departamento;

  const canton = extraer(datosPaciente, "Cantón Domicilio", ["Área Geográfica", "Asegurado"]);
  if (canton) out.canton = canton;

  const area = extraer(datosPaciente, "Área Geográfica de Domicilio", ["Asegurado", "Área Cotización"]);
  if (area) out.area = normalizarArea(area);

  const afiliacion = extraer(datosPaciente, "Número de Afiliación", ["Lugar Trabajo", "B. Datos"]);
  if (afiliacion) out.numeroAfiliacion = afiliacion;

  // ── Responsable (sección B) ──
  const responsable: ResponsablePaciente = { nombre: "" };
  const respTipo = extraer(datosFamilia, "Responsable", ["Nombre"]);
  if (respTipo) responsable.parentesco = respTipo;

  const respNombre = extraer(datosFamilia, "Nombre", ["Documento Identidad", "Dirección"]);
  if (respNombre) responsable.nombre = limpiarNombre(respNombre);

  const respDoc = extraer(datosFamilia, "Documento Identidad", ["Dirección", "Teléfono"]);
  if (respDoc) responsable.documento = respDoc.replace(/^DUI\s*:?\s*/i, "DUI: ").trim();

  const respDir = extraer(datosFamilia, "Dirección", ["Teléfono", "C. Datos"]);
  if (respDir) responsable.direccion = respDir;

  const respTel = datosFamilia.match(/Tel(?:é|e)fono\s*:?\s*(\d{4}-\d{4})/);
  if (respTel) responsable.telefono = respTel[1];

  if (responsable.nombre) out.responsable = responsable;

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser: Hoja de Ingreso y Egreso
// ─────────────────────────────────────────────────────────────────────────────

function parsearIngresoEgreso(texto: string): CamposExtraidos {
  const out: CamposExtraidos = {};
  const datosPaciente = seccion(texto, "A. DATOS DEL PACIENTE", "B. DATOS DEL INGRESO");
  const datosIngreso  = seccion(texto, "B. DATOS DEL INGRESO", "C. RUTA DE MOVIMIENTO");

  // Expediente: "NEC:22-26"
  const exp = texto.match(/NEC\s*:?\s*([\d\w-]+)/i);
  if (exp) out.expediente = exp[1].trim();

  // DUI puede venir como "Tipo documento: Documento Único Identidad 03472455-5"
  const dui = texto.match(/(\d{8}-\d)/);
  if (dui) out.dui = dui[1];

  // No. Afiliación
  const afi = texto.match(/No\.\s*Afiliaci(?:ó|o)n\s*:?\s*([\d\w-]+)/i);
  if (afi) out.numeroAfiliacion = afi[1];

  const apellidos = extraer(datosPaciente, "Apellidos", ["Nombres", "Fecha"]);
  if (apellidos) out.apellidos = limpiarNombre(apellidos);

  const nombres = extraer(datosPaciente, "Nombres", ["Fecha Nacimiento", "Fecha de Nacimiento", "Edad"]);
  if (nombres) out.nombres = limpiarNombre(nombres);

  const fechaNac = extraer(datosPaciente, "Fecha Nacimiento", ["Edad", "Sexo"]);
  if (fechaNac) {
    const f = parseFechaEs(fechaNac.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)?.[0]);
    if (f) out.fechaNacimiento = f;
  }

  const sexo = extraer(datosPaciente, "Sexo", ["Dirección residencia", "Departamento"]);
  if (sexo) out.genero = normalizarGenero(sexo);

  const direccion = extraer(datosPaciente, "Dirección residencia", ["Departamento", "Municipio"]);
  if (direccion) out.direccion = direccion;

  const departamento = extraer(datosPaciente, "Departamento", ["Municipio", "Cantón"]);
  if (departamento) out.departamento = departamento;

  const municipio = extraer(datosPaciente, "Municipio", ["Cantón", "Área geográfica"]);
  if (municipio) out.municipio = municipio;

  const canton = extraer(datosPaciente, "Cantón", ["Área geográfica", "Nacionalidad"]);
  if (canton && canton !== "N/A") out.canton = canton;

  const area = extraer(datosPaciente, "Área geográfica", ["Nacionalidad", "Teléfono"]);
  if (area) out.area = normalizarArea(area);

  const nacionalidad = extraer(datosPaciente, "Nacionalidad", ["Teléfono", "Responsable"]);
  if (nacionalidad) out.nacionalidad = nacionalidad;

  const tel = datosPaciente.match(/Tel(?:é|e)fono\s*:?\s*(\d{4}-\d{4})/);
  if (tel) out.telefono = tel[1];

  // Responsable
  const responsable: ResponsablePaciente = { nombre: "" };
  const respNombre = extraer(datosPaciente, "Responsable", [
    "Documento responsable", "Teléfono responsable", "Parentesco responsable",
  ]);
  if (respNombre) responsable.nombre = limpiarNombre(respNombre);

  const respDoc = extraer(datosPaciente, "Documento responsable", [
    "Teléfono responsable", "Parentesco responsable",
  ]);
  if (respDoc) responsable.documento = respDoc;

  const respTel = datosPaciente.match(/Tel(?:é|e)fono\s+responsable\s*:?\s*(\d{4}-\d{4})/i);
  if (respTel) responsable.telefono = respTel[1];

  const respPar = extraer(datosPaciente, "Parentesco responsable", [
    "Nombre del establecimiento", "Código UCSF", "B. DATOS",
  ]);
  if (respPar) responsable.parentesco = respPar;

  if (responsable.nombre) out.responsable = responsable;

  // ── Datos del ingreso ──
  const procedencia = extraer(datosIngreso, "Procedencia de ingreso", [
    "Circunstancia de ingreso", "Especialidad",
  ]);
  if (procedencia) {
    // Si dice "Referido" la procedencia real está en otro lado
    out.establecimientoProcedencia = procedencia;
  }

  const circ = extraer(datosIngreso, "Circunstancia de ingreso", [
    "Especialidad", "Fecha de ingreso",
  ]);
  if (circ) out.circunstanciaIngreso = normalizarCircunstancia(circ);

  const especialidad = extraer(datosIngreso, "Especialidad en la que ingresa", [
    "Fecha de ingreso", "Hora de ingreso",
  ]);

  const fechaIng = extraer(datosIngreso, "Fecha de ingreso", ["Hora de ingreso", "Servicio"]);
  const horaIng  = extraer(datosIngreso, "Hora de ingreso", ["Servicio en la que ingresa", "Embarazada"]);
  if (fechaIng) {
    const f = parseFechaEs(fechaIng.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)?.[0]);
    if (f) {
      const horaMatch = horaIng?.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/);
      out.fechaIngreso = horaMatch ? combinarFechaHora(f, horaMatch[0]) : f;
    }
  }

  const servicio = extraer(datosIngreso, "Servicio en la que ingresa", [
    "Embarazada", "Semanas de amenorrea", "Diagnóstico",
  ]);
  if (servicio) out.servicioIngreso = servicio;
  else if (especialidad) out.servicioIngreso = especialidad;

  // Diagnóstico: "Enfermedad renal cronica etapa 5 (estadio 5)" + CIE-10 N18.5
  const dxMatch = datosIngreso.match(
    /Diagn(?:ó|o)stico\s+de\s+ingreso\s*:?\s*"?([^"]+?)"?\s+C(?:ó|o)digo\s+CIE-?10\s*:?\s*([A-Z]\d{2}(?:\.\d+)?)/i
  );
  if (dxMatch) {
    out.diagnosticoIngreso = {
      descripcion: dxMatch[1].trim(),
      codigo: dxMatch[2].trim(),
    };
  }

  const medico = extraer(datosIngreso, "Nombre del médico que indicó el ingreso", [
    "Cargo", "Responsable de elaborar", "Fecha y hora",
  ]);
  if (medico) out.medicoIngresoNombre = limpiarNombre(medico);

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Limpieza de nombres (mayúsculas mixtas, espacios)
// ─────────────────────────────────────────────────────────────────────────────

function limpiarNombre(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\*+$/, "")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

export async function parsearPDF(file: File): Promise<ResultadoParser> {
  const textoCrudo = await extraerTextoPDF(file);
  const tipo = detectarTipoHoja(textoCrudo);
  let campos: CamposExtraidos = {};
  if (tipo === "identificacion") campos = parsearIdentificacion(textoCrudo);
  else if (tipo === "ingreso_egreso") campos = parsearIngresoEgreso(textoCrudo);
  return { tipo, campos, textoCrudo };
}

/**
 * Fusiona dos resultados de parser. `base` tiene prioridad para campos definidos,
 * `agregado` rellena los campos que `base` no trajo.
 */
export function fusionarCampos(
  base: CamposExtraidos,
  agregado: CamposExtraidos
): CamposExtraidos {
  const out: CamposExtraidos = { ...agregado, ...base };

  // Responsable: fusionar campo a campo, base tiene prioridad
  if (base.responsable || agregado.responsable) {
    out.responsable = {
      nombre: base.responsable?.nombre || agregado.responsable?.nombre || "",
      parentesco: base.responsable?.parentesco || agregado.responsable?.parentesco,
      documento: base.responsable?.documento || agregado.responsable?.documento,
      telefono: base.responsable?.telefono || agregado.responsable?.telefono,
      direccion: base.responsable?.direccion || agregado.responsable?.direccion,
    };
  }

  return out;
}
