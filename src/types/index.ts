export type UserRole = "medico" | "esdomed" | "trabajo_social" | "psicologia" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  role: UserRole;
  servicio?: string;   // solo médicos — campo legacy (un servicio)
  servicios?: string[]; // solo médicos — multi-servicio (campo nuevo)
  createdAt: Date;
}

export type EstadoTraslado = "pendiente" | "en_revision" | "aprobado" | "rechazado";

export interface SolicitudTraslado {
  id?: string;
  medicoId: string;
  medicoNombre: string;
  medicoServicio: string;
  pacienteNombre: string;
  pacienteExpediente: string;
  servicioOrigen: string;
  servicioDestino: string;
  camaOrigen: string;
  camaDestino: string;
  motivoTraslado: string;
  estado: EstadoTraslado;
  creadoEn: Date;
  actualizadoEn: Date;
  revisadoPor?: string;       // uid del personal esdomed
  revisadoPorNombre?: string;
  notasEsdomed?: string;
}

export type EstadoFallecido = "pendiente" | "confirmado";

export interface NotificacionFallecido {
  id?: string;
  medicoId: string;
  medicoNombre: string;
  medicoServicio: string;
  pacienteNombre: string;
  pacienteExpediente: string;
  servicio: string;
  cama: string;
  fechaDefuncion: Date;
  causaMuerte?: string;
  estado: EstadoFallecido;
  creadoEn: Date;
  confirmadoEn?: Date;
  confirmadoPor?: string;
  confirmadoPorNombre?: string;
  // Seguimiento de productividad ESDOMED
  digitaSimmow?: string;
  digitaSimmowEn?: Date;
  entregaCertificado?: string;
  entregaCertificadoEn?: Date;
  recibeDePs?: string;          // psicología / trabajo social
  recibeDePsEn?: Date;
  recibeDePsUid?: string;       // uid del usuario asignado (set by ESDOMED)
  recibeDePsConfirmado?: boolean;
  recibeDePsConfirmadoEn?: Date;
  tramitaDefuncion?: string;
  tramitaDefuncionEn?: Date;
  estadoEntregaCertificado?: "pendiente" | "entregado";
  tipoCertificado?: "digital" | "manual";
  actualizoFieh?: boolean;
  familiarNombre?: string;
  familiarDui?: string;
  familiarTelefono?: string;
  familiarParentesco?: string;
}

export type EstadoImpresion = "pendiente" | "impreso";

export interface SolicitudImpresion {
  id?: string;
  medicoId: string;
  medicoNombre: string;
  medicoServicio: string;
  descripcion: string;
  copias: number;
  pdfUrl: string;
  pdfNombre: string;
  estado: EstadoImpresion;
  creadoEn: Date;
  impresoPor?: string;
  impresoPorNombre?: string;
  impresoEn?: Date;
}
