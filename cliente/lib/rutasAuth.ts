import { router } from "expo-router";
import type { Usuario } from "../stores/auth.store";

/** Dominios internos Medly → rol (cuentas dadas de alta en BD). */
export function inferirRolDesdeCorreo(correo: string): Usuario["rol"] | null {
  const c = correo.trim().toLowerCase();
  if (c.endsWith("@medly.d")) return "MEDICO";
  if (c.endsWith("@medly.r")) return "RECEPCIONISTA";
  if (/@medly\.(com|local|test)$/i.test(c)) return null;
  return null;
}

export function resolverRolSesion(
  usuario: Usuario,
  correo?: string,
): Usuario["rol"] {
  const email = (correo ?? usuario.email ?? "").trim().toLowerCase();
  const inferido = inferirRolDesdeCorreo(email);
  if (
    inferido &&
    (usuario.rol === "PACIENTE" || !usuario.rol)
  ) {
    return inferido;
  }
  return usuario.rol;
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
