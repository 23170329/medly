import type { Usuario } from "../stores/auth.store";
import { inferirRolDesdeCorreo } from "./rutasAuth";

type UsuarioApi = {
  id?: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  pacienteId?: number;
  staffId?: number;
  medicoId?: number;
};

function normalizarRol(raw: unknown): Usuario["rol"] | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const u = raw.trim().toUpperCase();
  if (
    u === "PACIENTE" ||
    u === "MEDICO" ||
    u === "RECEPCIONISTA" ||
    u === "ADMIN"
  ) {
    return u;
  }
  return null;
}

/** Convierte la respuesta de login/refresh al modelo de sesión de la app. */
export function normalizarUsuarioSesion(
  raw: UsuarioApi,
  correoLogin?: string,
): Usuario {
  const email = (raw.email ?? correoLogin ?? "").trim().toLowerCase();
  let rol = normalizarRol(raw.rol);

  if (rol === "MEDICO" || rol === "RECEPCIONISTA" || rol === "ADMIN") {
    return {
      id: String(raw.id ?? ""),
      nombre: raw.nombre ?? "",
      apellido: raw.apellido ?? "",
      email,
      rol,
      pacienteId: raw.pacienteId,
      staffId: raw.staffId,
      medicoId: raw.medicoId,
    };
  }

  if (raw.medicoId != null) rol = "MEDICO";
  else if (raw.staffId != null) rol = "RECEPCIONISTA";

  const inferido = inferirRolDesdeCorreo(email);
  if (inferido) rol = inferido;

  if (!rol) rol = "PACIENTE";

  return {
    id: String(raw.id ?? ""),
    nombre: raw.nombre ?? "",
    apellido: raw.apellido ?? "",
    email,
    rol,
    pacienteId: raw.pacienteId,
    staffId: raw.staffId,
    medicoId: raw.medicoId,
  };
}
