import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore, type Usuario } from "../stores/auth.store";
import { redirigirTrasLogin } from "../lib/rutasAuth";

/** Redirige si el rol de sesión no coincide con las rutas del layout. */
export function useGuardRol(rolesPermitidos: Usuario["rol"][]): void {
  const cargando = useAuthStore((s) => s.cargando);
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    if (cargando) return;
    if (!token) {
      router.replace("/(auth)/iniciar-sesion");
      return;
    }
    if (!usuario) {
      router.replace("/(auth)/iniciar-sesion");
      return;
    }
    const permitidos = rolesPermitidos.join(",");
    const actual = usuario.rol;
    if (!rolesPermitidos.includes(actual)) {
      redirigirTrasLogin(usuario, usuario.email);
    }
  }, [cargando, token, usuario, rolesPermitidos]);
}
