import api from "./apiCliente";
import { API_URL } from "../constants/api";

async function medicoFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = (data as { message?: string | string[] }).message ?? res.statusText;
    throw new Error(Array.isArray(raw) ? raw.join("\n") : String(raw));
  }
  return data as T;
}

export interface CitaMedicoDto {
  citaID: number;
  inicio: string;
  fin: string;
  estado: string;
  montoTotal: string;
  montoAnticipo: string;
  paciente?: {
    pacienteID: number;
    nombre: string;
    apellido_pat: string;
    apellido_mat?: string | null;
    telefono?: string | null;
  };
  sucursal?: { nombre: string; direccion?: string; telefono?: string };
  medico?: {
    nombre: string;
    apellidoPat: string;
    especialidad?: { nombre: string };
  };
}

export interface PacienteMedicoDto {
  pacienteID: number;
  nombre: string;
  apellido_pat: string;
  apellido_mat?: string | null;
  pesoKg?: number | string | null;
  alturaM?: number | string | null;
}

export interface ConsultaMedicoDto {
  consultaID: number;
  fechaRegistro: string;
  pacienteID?: number;
  citaID?: number | null;
  identificacion?: string | null;
  antecedentes?: string | null;
  interrogatorio?: string | null;
  exploracionFisica?: string | null;
  diagnosticos?: string | null;
  tratamiento?: string | null;
  pesoKg?: number | string | null;
  alturaM?: number | string | null;
  paciente?: {
    pacienteID: number;
    nombre: string;
    apellido_pat: string;
  };
}

export interface BloqueoDto {
  bloqueoID: number;
  inicio: string;
  fin: string;
  motivo?: string | null;
}

export function fetchHistorialMedico(token: string): Promise<CitaMedicoDto[]> {
  return medicoFetch("/medico/citas/historial", token);
}

export async function fetchHistorialMedicoAuthed(): Promise<CitaMedicoDto[]> {
  const { data } = await api.get<CitaMedicoDto[]>("/medico/citas/historial");
  return data;
}

export function fetchHistorialDetalleMedico(
  token: string,
  citaId: number,
): Promise<{ cita: CitaMedicoDto; consulta: ConsultaMedicoDto | null }> {
  return medicoFetch(`/medico/citas/historial/${citaId}`, token);
}

export async function fetchHistorialDetalleMedicoAuthed(
  citaId: number,
): Promise<{ cita: CitaMedicoDto; consulta: ConsultaMedicoDto | null }> {
  const { data } = await api.get<{ cita: CitaMedicoDto; consulta: ConsultaMedicoDto | null }>(
    `/medico/citas/historial/${citaId}`,
  );
  return data;
}

export function fetchCitasMedico(token: string): Promise<CitaMedicoDto[]> {
  return medicoFetch("/medico/citas", token);
}

export function fetchCitasPendientesMedico(token: string): Promise<CitaMedicoDto[]> {
  return medicoFetch("/medico/citas/pendientes-atencion", token);
}

export function fetchConsultasMedico(
  token: string,
  pacienteId?: number,
): Promise<ConsultaMedicoDto[]> {
  const q = pacienteId != null ? `?pacienteId=${pacienteId}` : "";
  return medicoFetch(`/medico/consultas${q}`, token);
}

export function fetchBloqueosMedico(token: string): Promise<BloqueoDto[]> {
  return medicoFetch("/medico/bloqueos", token);
}

export function crearBloqueoMedico(
  token: string,
  body: { inicio: string; fin: string; motivo?: string },
): Promise<BloqueoDto> {
  return medicoFetch("/medico/bloqueos", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function eliminarBloqueoMedico(
  token: string,
  bloqueoId: number,
): Promise<{ ok: boolean }> {
  return medicoFetch(`/medico/bloqueos/${bloqueoId}`, token, {
    method: "DELETE",
  });
}

export function fetchPacienteMedico(
  token: string,
  pacienteId: number,
): Promise<PacienteMedicoDto> {
  return medicoFetch(`/medico/pacientes/${pacienteId}`, token);
}

export interface HistorialExpedienteItemDto {
  citaID: number;
  inicio: string;
  fin: string;
  motivo: string | null;
  diagnostico: string | null;
}

export function fetchHistorialExpedientePaciente(
  token: string,
  pacienteId: number,
): Promise<HistorialExpedienteItemDto[]> {
  return medicoFetch(
    `/medico/pacientes/${pacienteId}/historial`,
    token,
  );
}

export function guardarExpedienteMedico(
  token: string,
  pacienteId: number,
  body: {
    identificacion?: string;
    antecedentes?: string;
    tratamiento?: string;
    pesoKg: number;
    alturaM: number;
  },
): Promise<{ paciente: PacienteMedicoDto; consulta: ConsultaMedicoDto }> {
  return medicoFetch(`/medico/pacientes/${pacienteId}/expediente`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type CausaCancelacionMedico =
  | "EMERGENCIA_MEDICA"
  | "ENFERMEDAD_MEDICO"
  | "CONFLICTO_AGENDA"
  | "REAGENDAMIENTO"
  | "OTRO";

export function cancelarCitaMedico(
  token: string,
  citaId: number,
  body: { causa: CausaCancelacionMedico; motivo: string },
): Promise<{ mensaje: string; reembolsoProcesado: boolean }> {
  return medicoFetch(`/medico/citas/${citaId}/cancelar`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function crearConsultaMedico(
  token: string,
  body: Record<string, unknown>,
): Promise<ConsultaMedicoDto> {
  return medicoFetch("/medico/consultas", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function actualizarConsultaMedico(
  token: string,
  id: number,
  body: Record<string, unknown>,
): Promise<ConsultaMedicoDto> {
  return medicoFetch(`/medico/consultas/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function nombrePaciente(
  p?: { nombre: string; apellido_pat: string; apellido_mat?: string | null },
): string {
  if (!p) return "Paciente";
  const am = p.apellido_mat ? ` ${p.apellido_mat}` : "";
  return `${p.nombre} ${p.apellido_pat}${am}`.trim();
}

export interface NotificacionMedicoDto {
  notificacionID: number;
  medicoID: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo?: string | null;
  citaID?: number | null;
  permiteReagendar?: boolean;
  fechaCreacion: string;
}

export function fetchNotificacionesMedico(
  token: string,
): Promise<NotificacionMedicoDto[]> {
  return medicoFetch("/medico/notificaciones", token);
}

export function fetchNotificacionesNoLeidasMedico(token: string): Promise<number> {
  return medicoFetch("/medico/notificaciones/no-leidas", token);
}

export function marcarNotificacionLeidaMedico(
  token: string,
  id: number,
): Promise<NotificacionMedicoDto> {
  return medicoFetch(`/medico/notificaciones/${id}/leida`, token, {
    method: "PATCH",
  });
}
