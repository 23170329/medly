import type { ImageSourcePropType } from "react-native";
import type { SucursalDto } from "../lib/medlyApi";

const IMG = {
  c1: require("../assets/sucursales/consultorio-1.png"),
  c2: require("../assets/sucursales/consultorio-2.png"),
  c3: require("../assets/sucursales/consultorio-3.png"),
  c4: require("../assets/sucursales/consultorio-4.png"),
  c5: require("../assets/sucursales/consultorio-5.png"),
  c6: require("../assets/sucursales/consultorio-6.png"),
} as const;

export interface CollageSucursal {
  readonly principal: ImageSourcePropType;
  readonly secundariaArriba: ImageSourcePropType;
  readonly secundariaAbajo: ImageSourcePropType;
}

/** Collage tipo mockup: foto grande izquierda + dos apiladas a la derecha. */
export function collageParaSucursal(s: Pick<SucursalDto, "nombre" | "sucursalID">): CollageSucursal {
  const n = s.nombre.trim().toLowerCase();
  if (n.includes("sur")) {
    return {
      principal: IMG.c4,
      secundariaArriba: IMG.c5,
      secundariaAbajo: IMG.c6,
    };
  }
  if (n.includes("norte")) {
    return {
      principal: IMG.c1,
      secundariaArriba: IMG.c2,
      secundariaAbajo: IMG.c3,
    };
  }
  const idx = Math.abs(s.sucursalID) % 3;
  const sets: CollageSucursal[] = [
    { principal: IMG.c1, secundariaArriba: IMG.c2, secundariaAbajo: IMG.c3 },
    { principal: IMG.c4, secundariaArriba: IMG.c5, secundariaAbajo: IMG.c6 },
    { principal: IMG.c3, secundariaArriba: IMG.c1, secundariaAbajo: IMG.c2 },
  ];
  return sets[idx] ?? sets[0];
}

/** @deprecated Usar collageParaSucursal */
export function imagenParaSucursal(sucursalID: number): ImageSourcePropType {
  return collageParaSucursal({ sucursalID, nombre: "" }).principal;
}

export function nombreCortoSucursal(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return partes.length > 1 ? partes[partes.length - 1] : nombre;
}

/** Orden visual: Norte, Sur, Centro, resto alfabético. */
export function ordenarSucursales(lista: SucursalDto[]): SucursalDto[] {
  const peso = (nombre: string): number => {
    const n = nombre.toLowerCase();
    if (n.includes("norte")) return 0;
    if (n.includes("sur")) return 1;
    if (n.includes("centro")) return 2;
    return 10;
  };
  return [...lista].sort(
    (a, b) => peso(a.nombre) - peso(b.nombre) || a.nombre.localeCompare(b.nombre),
  );
}
