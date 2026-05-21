import type { ImageSourcePropType } from "react-native";

/** Imágenes de consultorio para tarjetas de sucursal (orden fijo por índice). */
export const IMAGENES_SUCURSAL: readonly ImageSourcePropType[] = [
  require("../assets/sucursales/consultorio-1.png"),
  require("../assets/sucursales/consultorio-2.png"),
  require("../assets/sucursales/consultorio-3.png"),
  require("../assets/sucursales/consultorio-4.png"),
  require("../assets/sucursales/consultorio-5.png"),
  require("../assets/sucursales/consultorio-6.png"),
] as const;

export function imagenParaSucursal(sucursalID: number): ImageSourcePropType {
  const idx = Math.abs(sucursalID) % IMAGENES_SUCURSAL.length;
  return IMAGENES_SUCURSAL[idx];
}
