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
