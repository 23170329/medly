import type { SucursalDto } from "../lib/medlyApi";

/**
 * Enlace compartido de Google Business (reseñas, horario, ubicación).
 * Formato share.google que abriste desde el perfil del negocio.
 */
export const GOOGLE_BUSINESS_SHARE_URL =
  "https://share.google/voH7vFpY5WikkgO7H";

/** Alias corto por si cambias enlaces por sucursal más adelante. */
export const GOOGLE_BUSINESS_URLS = {
  default: GOOGLE_BUSINESS_SHARE_URL,
  centro: GOOGLE_BUSINESS_SHARE_URL,
  norte: GOOGLE_BUSINESS_SHARE_URL,
  sur: GOOGLE_BUSINESS_SHARE_URL,
} as const;

export function urlGoogleBusinessParaSucursal(_s?: SucursalDto): string {
  return GOOGLE_BUSINESS_SHARE_URL;
}

export function abrirEnlaceGoogleBusiness(): string {
  return GOOGLE_BUSINESS_SHARE_URL;
}
