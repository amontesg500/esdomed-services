export const SERVICIOS_HOSPITALARIOS = [
  "Emergencia",
  "Bienestar Magisterial",
  "Unidad de Cuidados Intermedios Convenios (ISBM)",
  "Unidad de Cuidados Intensivos Convenios (ISBM)",
  "Cirugía Hombres 1",
  "Cirugía Mujeres 1",
  "Cirugía Cardiovascular",
  "Neurocirugía",
  "Dolor y Cuidados Paliativos",
  "Unidad de Cuidados Intermedios Adultos MINSAL",
  "Unidad de Cuidados Intermedios Aislados Adultos",
  "Unidad de Cuidados Intermedios Crónicos Adultos",
  "Medicina Interna Hombres 1",
  "Medicina Interna Hombres 2",
  "Medicina Interna Hombres 3",
  "Medicina Interna Mujeres 1",
  "Medicina Interna Mujeres 2",
  "Medicina Interna Mujeres 3",
  "Servicio de Cardiología",
  "Servicio de Hematología",
  "Servicio de Aislados",
  "Servicio de Oncología",
  "Unidad de Cuidados Intensivos General I Adultos",
  "Unidad de Cuidados Intensivos Aislados Adultos",
  "Unidad de Cuidados Intensivos Cardiovascular Adultos",
  "Unidad de Cuidados Intensivos Extracorpórea Adultos",
  "Unidad de Cuidados Intensivos Quirúrgicos Adultos",
  "Unidad de Cuidados Neurointensivos Adultos",
  "Unidad de Cuidados Coronarios y Posquirúrgicos Cardiovasculares",
  "Unidad de Evaluación y Observación Médica",
  "Quimioterapia Ambulatoria",
  "Unidad de Terapia Intervencionista Endovascular",
  "Diálisis Peritoneal",
  "Terapias Sanguíneas Extracorpórea",
  "Centro Quirúrgico",
] as const;

export type ServicioHospitalario = (typeof SERVICIOS_HOSPITALARIOS)[number];

// ── Helpers de generación de camas ────────────────────────────────────────────

/** PREFIX-01, PREFIX-02, ...  (guión + 2 dígitos) */
function beds(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

/** 1A, 2A, 3A, ...  (número + sufijo, formato UCI) */
function bedsNS(count: number, suffix: string): string[] {
  return Array.from({ length: count }, (_, i) => `${i + 1}${suffix}`);
}

/** CR01, CR02, ...  (prefijo + número, sin guión, 2 dígitos) */
function bedsPN(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`);
}

/** 01, 02, ..., 30  (números solos con cero inicial) */
function bedsZP(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0"));
}

/** 1, 2, ..., 60  (números solos sin cero inicial) */
function bedsN(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

// ── Camas por servicio ────────────────────────────────────────────────────────

export const CAMAS_POR_SERVICIO: Record<ServicioHospitalario, string[]> = {
  // Sin camas fijas
  "Emergencia":                                                        [],

  // Bienestar Magisterial (camas: 1, 2)
  "Bienestar Magisterial":                                             bedsN(2),
  "Unidad de Cuidados Intensivos Convenios (ISBM)":                   bedsN(10),
  "Unidad de Cuidados Intermedios Convenios (ISBM)":                  bedsN(10),

  // Cirugía
  "Cirugía Hombres 1":                                                bedsZP(12),   // 01-12
  "Cirugía Mujeres 1":                                                bedsZP(12),   // 01-12
  "Cirugía Cardiovascular":                                           beds("CCV", 8),
  "Neurocirugía":                                                     beds("NEU", 10),

  // Dolor / Paliativos  (1P, 2P, …, 10P)
  "Dolor y Cuidados Paliativos":                                      bedsNS(10, "P"),

  // UCIN — Cuidados Intermedios
  "Unidad de Cuidados Intermedios Adultos MINSAL":                    bedsZP(30),   // 01-30
  "Unidad de Cuidados Intermedios Aislados Adultos":                  bedsPN("AI", 5),   // AI01-AI05
  "Unidad de Cuidados Intermedios Crónicos Adultos":                  bedsPN("CR", 21),  // CR01-CR21

  // Medicina Interna
  "Medicina Interna Hombres 1":                                       beds("MH1", 45),
  "Medicina Interna Hombres 2":                                       beds("MH2", 25),
  "Medicina Interna Hombres 3":                                       beds("MH3", 20),
  "Medicina Interna Mujeres 1":                                       beds("MM1", 50),
  "Medicina Interna Mujeres 2":                                       beds("MM2", 30),
  "Medicina Interna Mujeres 3":                                       beds("MM3", 32),
  "Servicio de Cardiología":                                          beds("CAR", 8),
  "Servicio de Hematología":                                          beds("HEM", 50),
  "Servicio de Aislados":                                             beds("MAI", 12),
  "Servicio de Oncología":                                            beds("ONC", 15),

  // UCI — Cuidados Intensivos  (formato: NúmeroSufijo → 1A, 2A, …)
  "Unidad de Cuidados Intensivos General I Adultos":                  bedsNS(10, "G1"),  // 1G1-10G1
  "Unidad de Cuidados Intensivos Aislados Adultos":                   bedsNS(8,  "A"),   // 1A-8A
  "Unidad de Cuidados Intensivos Cardiovascular Adultos":             bedsNS(12, "C"),   // 1C-12C
  "Unidad de Cuidados Intensivos Extracorpórea Adultos":              bedsNS(9,  "E"),   // 1E-9E
  "Unidad de Cuidados Intensivos Quirúrgicos Adultos":                bedsNS(9,  "Q"),   // 1Q-9Q
  "Unidad de Cuidados Neurointensivos Adultos":                       bedsNS(10, "N"),   // 1N-10N
  "Unidad de Cuidados Coronarios y Posquirúrgicos Cardiovasculares":  bedsNS(7,  "CPC"), // 1CPC-7CPC

  // Servicios ambulatorios y especiales
  "Unidad de Evaluación y Observación Médica":                        beds("EOM", 10),
  "Quimioterapia Ambulatoria":                                        bedsPN("QTA", 20), // QTA01-QTA20
  "Unidad de Terapia Intervencionista Endovascular":                  ["UTE-1", "UTE-2", "UTE-3"],
  "Diálisis Peritoneal":                                              bedsN(60),          // 1-60
  "Terapias Sanguíneas Extracorpórea":                                bedsN(10),          // 1-10

  // Centro Quirúrgico  (Q01-Q05 quirófanos · R1-R12 recuperación)
  "Centro Quirúrgico": [
    ...bedsPN("Q", 5),
    ...Array.from({ length: 12 }, (_, i) => `R${i + 1}`),
  ],
};
