// ── Cálculo de fechas ────────────────────────────────────────────────────────

/**
 * Calcula la fecha de fin de incapacidad.
 * Convención: si la incapacidad empieza el día X por N días, termina el día X + (N - 1).
 * Ej: desde 4/5, 31 días → hasta 3/6. Pero el formato del HNES usa "hasta 4/6" para 31 días,
 * lo que sugiere `hasta = desde + dias` (no -1). Usamos esa convención.
 */
export function calcularFechaHasta(desde: Date, diasIncapacidad: number): Date {
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + diasIncapacidad);
  return hasta;
}

// ── Formato de fechas para la constancia ─────────────────────────────────────

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Formato "25 mayo, 2026" (como aparece en la constancia oficial). */
export function formatFechaConstancia(d: Date): string {
  return `${d.getDate()} ${MESES_ES[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Formato "25/05/2026". */
export function formatFechaCorta(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Formato "DD/M/YYYY" como aparece en el ejemplo de constancia (4/5/2026). */
export function formatFechaConstanciaCorta(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ── Número a letras (español, 0–999) ─────────────────────────────────────────

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const ESPECIALES_10_19 = [
  "diez", "once", "doce", "trece", "catorce", "quince",
  "dieciséis", "diecisiete", "dieciocho", "diecinueve",
];
const ESPECIALES_20_29 = [
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro",
  "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta",
  "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos",
  "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function _0_99(n: number): string {
  if (n === 0) return "";
  if (n < 10) return UNIDADES[n];
  if (n < 20) return ESPECIALES_10_19[n - 10];
  if (n < 30) return ESPECIALES_20_29[n - 20];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return DECENAS[d];
  return `${DECENAS[d]} y ${UNIDADES[u]}`;
}

function _0_999(n: number): string {
  if (n === 0) return "cero";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const cent = c > 0 ? CENTENAS[c] : "";
  const rest = _0_99(resto);
  if (cent && rest) return `${cent} ${rest}`;
  return cent || rest;
}

/**
 * Convierte un número entero (0–9999) a su representación en letras en español.
 * Para incapacidades es más que suficiente (raramente exceden 365 días).
 */
export function numeroALetras(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const entero = Math.floor(n);
  if (entero < 1000) return _0_999(entero);
  // Hasta 9999 — incapacidades muy raras pero por si acaso
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  const milesStr = miles === 1 ? "mil" : `${_0_999(miles)} mil`;
  if (resto === 0) return milesStr;
  return `${milesStr} ${_0_999(resto)}`;
}
