import { router } from "expo-router";
import type { Usuario } from "../stores/auth.store";

/** Dominios internos Medly → rol (cuentas dadas de alta en BD). */
export function inferirRolDesdeCorreo(correo: string): Usuario["rol"] | null {
  const c = correo.trim().toLowerCase();
  if (c.endsWith("@medly.d")) return "MEDICO";
  if (c.endsWith("@medly.r")) return "RECEPCIONISTA";
  const m = c.match(/^([^@]+)@medly\.(com|local|test)$/);
  if (m) {
    const local = m[1];
    if (/^(doctor|medico|dr)\b/i.test(local)) return "MEDICO";
    if (/^(recepcion|recep)\b/i.test(local)) return "RECEPCIONISTA";
  }
  return null;
}

export function resolverRolSesion(
  usuario: Usuario,
  correo?: string,
): Usuario["rol"] {
  const rolApi = usuario.rol;
  if (
    rolApi === "MEDICO" ||
    rolApi === "RECEPCIONISTA" ||
    rolApi === "ADMIN"
  ) {
    return rolApi;
  }
  if (usuario.medicoId != null) return "MEDICO";
  if (usuario.staffId != null) return "RECEPCIONISTA";

  const email = (correo ?? usuario.email ?? "").trim().toLowerCase();
  const inferido = inferirRolDesdeCorreo(email);
  if (inferido) return inferido;

  return rolApi ?? "PACIENTE";
}

export function redirigirTrasLogin(usuario: Usuario, correo?: string): void {
  const rol = resolverRolSesion(usuario, correo);
  if (rol === "RECEPCIONISTA") {
    router.replace("/(recepcion)");
    return;
  }
  if (rol === "MEDICO") {
    router.replace("/(medico)");
    return;
  }
  router.replace("/(privado)/inicio");
}

export function redirigirTrasSplash(
  usuario: Usuario | null,
  tieneToken: boolean,
): void {
  if (tieneToken && usuario) {
    redirigirTrasLogin(usuario, usuario.email);
    return;
  }
  if (tieneToken) {
    router.replace("/(privado)/inicio");
    return;
  }
  router.replace("/(auth)/iniciar-sesion");
}
