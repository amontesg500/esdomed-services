export const SERVICIOS_HOSPITALARIOS = [
  "Emergencia",
  "Bienestar Magisterial",
  "UCIN ISBM",
  "UCI ISBM",
  "Cirugía Hombres 1",
  "Cirugía Mujeres 1",
  "Cirugía Cardiovascular",
  "Neurocirugia",
  "Dolor y Cuidados Paliativos",
  "UCIN Adultos",
  "UCIN Aislados",
  "UCIN Crónicos",
  "Medicina Interna Hombres 1",
  "Medicina Interna Hombres 2",
  "Medicina Interna Hombres 3",
  "Medicina Interna Mujeres 1",
  "Medicina Interna Mujeres 2",
  "Medicina Interna Mujeres 3",
  "Medicina Interna Cardiología",
  "Medicina Interna Hematología",
  "Medicina Interna Aislado",
  "Medicina Interna Oncologia",
  "UCI General I",
  "UCI General II",
  "UCI Aislados",
  "UCI Cardiovascular",
  "UCI Extracorpórea",
  "UCI Quirúrgica",
  "UCI Neurointensivos",
  "UCI Coronarios y Postquirúrgicos (UCCP)",
  "Evaluación y Observación Médica",
  "Quimioterapia Ambulatoria",
  "Terapia Intervencionista Endovascular",
  "Dialisis Peritoneal",
  "Terapias Sanguíneas Extracorpórea",
] as const;

export type ServicioHospitalario = (typeof SERVICIOS_HOSPITALARIOS)[number];

// ── Camas por servicio ────────────────────────────────────────────────────────

function beds(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

export const CAMAS_POR_SERVICIO: Record<ServicioHospitalario, string[]> = {
  // Sin camas asignadas (área de primer contacto / servicio sin cama fija)
  "Emergencia":                              [],
  "UCI General II":                          [],

  // Bienestar Magisterial
  "Bienestar Magisterial":                   beds("BM", 10),
  "UCI ISBM":                                beds("UCIBM", 10),
  "UCIN ISBM":                               beds("UCIMBM", 10),

  // Cirugía
  "Cirugía Hombres 1":                       beds("CH", 12),
  "Cirugía Mujeres 1":                       beds("CM", 12),
  "Cirugía Cardiovascular":                  beds("CCB", 8),
  "Neurocirugia":                            beds("NEU", 12),

  // Medicina Interna
  "Medicina Interna Hombres 1":              beds("MH1", 47),
  "Medicina Interna Hombres 2":              beds("MH2", 27),
  "Medicina Interna Hombres 3":              beds("MH3", 22),
  "Medicina Interna Mujeres 1":              beds("MM1", 52),
  "Medicina Interna Mujeres 2":              beds("MM2", 32),
  "Medicina Interna Mujeres 3":              beds("MM3", 34),
  "Medicina Interna Cardiología":            beds("CAR", 10),
  "Medicina Interna Hematología":            beds("HEM", 52),
  "Medicina Interna Aislado":                beds("MAI", 14),
  "Medicina Interna Oncologia":              beds("ONC", 17),

  // UCI (Intensivos)
  "UCI General I":                           beds("1G1", 10),
  "UCI Aislados":                            beds("A", 7),
  "UCI Cardiovascular":                      beds("C", 12),
  "UCI Extracorpórea":                       beds("E", 7),
  "UCI Quirúrgica":                          beds("Q", 9),
  "UCI Neurointensivos":                     beds("N", 10),
  "UCI Coronarios y Postquirúrgicos (UCCP)": beds("1CPC", 7),

  // UCIN (Intermedios)
  "UCIN Adultos":                            beds("UCIM", 30),
  "UCIN Aislados":                           beds("AI0", 5),
  "UCIN Crónicos":                           beds("CR0", 21),

  // Servicios especiales / ambulatorios
  "Dolor y Cuidados Paliativos":             beds("P", 10),
  "Evaluación y Observación Médica":         beds("EOM", 10),
  "Quimioterapia Ambulatoria":               beds("QTA", 14),
  "Terapia Intervencionista Endovascular":   beds("UTE", 3),
  "Dialisis Peritoneal":                     beds("DP", 60),
  "Terapias Sanguíneas Extracorpórea":       beds("TSE", 10),
};
