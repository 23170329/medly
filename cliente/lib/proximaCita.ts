import {
  fetchMisCitas,
  fetchProximaCita,
  type CitaDto,
  type EstadoCitaApi,
} from "./medlyApi";
import { esCitaActivaFutura } from "./estadoCita";

function esFutura(inicio: string): boolean {
  return new Date(inicio).getTime() >= Date.now();
}

function ordenarPorInicio(a: CitaDto, b: CitaDto): number {
  return new Date(a.inicio).getTime() - new Date(b.inicio).getTime();
}

function elegirDesdeLista(citas: CitaDto[]): CitaDto | null {
  const candidatas = citas
    .filter(
      (c) =>
        esCitaActivaFutura(c.estado as EstadoCitaApi) && esFutura(c.inicio),
    )
    .sort(ordenarPorInicio);
  return candidatas[0] ?? null;
}

/** Próxima cita: API dedicada y, si falla o viene vacía, mis citas. */
export async function resolverProximaCita(): Promise<CitaDto | null> {
  try {
    const px = await fetchProximaCita();
    if (px) return px;
  } catch {
    /* endpoint o red */
  }

  try {
    const todas = await fetchMisCitas();
    return elegirDesdeLista(todas);
  } catch {
    return null;
  }
}
