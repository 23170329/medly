import { API_URL } from "../constants/api";
import type { CitaMedicoDto } from "./medicoApi";

async function recepcionFetch<T>(
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

export interface PacienteBusquedaDto {
  pacienteID: number;
  nombre: string;
  apellido_pat: string;
  apellido_mat?: string | null;
  correoElectronico: string;
  telefono?: string | null;
}

export function buscarPacientesRecepcion(
  token: string,
  q: string,
): Promise<PacienteBusquedaDto[]> {
  const query = encodeURIComponent(q.trim());
  return recepcionFetch(`/recepcion/pacientes?q=${query}`, token);
}

export function fetchCitasRecepcion(token: string): Promise<CitaMedicoDto[]> {
  return recepcionFetch("/recepcion/citas", token);
}

export function crearCitaMostradorRecepcion(
  token: string,
  pacienteId: number,
  slotID: number,
): Promise<CitaMedicoDto> {
  return recepcionFetch("/recepcion/citas/mostrador", token, {
    method: "POST",
    body: JSON.stringify({ pacienteId, slotID }),
  });
}

export function nombrePacienteRecep(p: PacienteBusquedaDto): string {
  const am = p.apellido_mat ? ` ${p.apellido_mat}` : "";
  return `${p.nombre} ${p.apellido_pat}${am}`.trim();
}
