import type { SucursalDto } from "../lib/medlyApi";
import { nombreCortoSucursal, ordenarSucursales } from "./sucursalesVisuales";

/** Tarjetas Norte / Sur cuando el API aún no devuelve datos en Railway. */
export const SUCURSALES_CATALOGO: readonly SucursalDto[] = [
  {
    sucursalID: 1001,
    nombre: "Medly Norte",
    direccion: "Blvd. Industrial 456",
    telefono: "6677654321",
    capacidadConsultorios: 3,
    latitud: 24.83,
    longitud: -107.38,
  },
  {
    sucursalID: 1002,
    nombre: "Medly Sur",
    direccion: "Calle Reforma 789",
    telefono: "6671112233",
    capacidadConsultorios: 4,
    latitud: 24.79,
    longitud: -107.41,
  },
] as const;

function coincideSucursal(a: SucursalDto, b: SucursalDto): boolean {
  const ca = nombreCortoSucursal(a.nombre).toLowerCase();
  const cb = nombreCortoSucursal(b.nombre).toLowerCase();
  return ca === cb || a.sucursalID === b.sucursalID;
}

/** API + catálogo local: siempre muestra Norte y Sur. */
export function resolverListaSucursales(api: SucursalDto[]): SucursalDto[] {
  const base = [...SUCURSALES_CATALOGO];
  if (!api.length) {
    return ordenarSucursales(base);
  }

  const fusion: SucursalDto[] = base.map((cat) => {
    const remota = api.find((s) => coincideSucursal(s, cat));
    return remota ? { ...cat, ...remota, nombre: remota.nombre || cat.nombre } : cat;
  });

  for (const s of api) {
    if (!fusion.some((f) => coincideSucursal(f, s))) {
      fusion.push(s);
    }
  }

  return ordenarSucursales(fusion);
}
