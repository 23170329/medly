import type { SlotDto } from "./medlyApi";

/** Rango laboral para la rejilla (último inicio = 19:30 si termina a las 20:00). */
export const HORA_INICIO_LABORAL = 8;
export const HORA_FIN_LABORAL = 20;
export const INTERVALO_MINUTOS = 30;

/**
 * Citas u ocupaciones mock mientras conectas el backend.
 * Formato fecha local YYYY-MM-DD y hora "HH:mm" (24 h).
 */
export interface CitaOcupadaMock {
  fecha: string;
  hora: string;
}

/** Ejemplo: descomenta o añade entradas para probar bloques en rojo. */
export const MOCK_CITAS_OCUPADAS: CitaOcupadaMock[] = [
  // { fecha: "2026-05-21", hora: "10:00" },
  // { fecha: "2026-05-21", hora: "10:30" },
];

export function normalizarFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function esMismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function parseFechaLocal(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Clave estable para comparar slot / mock: fecha + minutos desde medianoche. */
export function claveFechaHora(fechaYmd: string, horaHm: string): string {
  return `${fechaYmd}T${horaHm}`;
}

export function slotAFechaHoraLocal(s: SlotDto): { fecha: string; hora: string } {
  const d = new Date(s.inicio);
  const fecha = normalizarFechaLocal(d);
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return { fecha, hora };
}

/** Fechas únicas con al menos un slot, ordenadas ascendente. */
export function fechasUnicasDesdeSlots(slots: SlotDto[]): Date[] {
  const seen = new Set<string>();
  const out: Date[] = [];
  for (const s of slots) {
    const d = new Date(s.inicio);
    const key = normalizarFechaLocal(d);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
  }
  out.sort((a, b) => a.getTime() - b.getTime());
  return out;
}

export interface CeldaHorario {
  /** "HH:mm" local */
  hora: string;
  etiqueta: string;
  disponible: boolean;
  /** Solo si disponible y viene del API */
  slot: SlotDto | null;
}

const mockOcupadoSet = new Set(
  MOCK_CITAS_OCUPADAS.map((m) => claveFechaHora(m.fecha, m.hora)),
);

function enMockOcupadas(fechaYmd: string, horaHm: string): boolean {
  return mockOcupadoSet.has(claveFechaHora(fechaYmd, horaHm));
}

/**
 * Todas las celdas de 30 min entre 8:00 y 20:00 para un día.
 * Disponible = existe slot del API con ese inicio exacto (local) y no está en mock ocupadas.
 * Mock fuerza ocupado aunque el API liste el slot (útil para demo).
 */
export function construirRejillaDia(
  dia: Date,
  slots: SlotDto[],
): CeldaHorario[] {
  const fechaYmd = normalizarFechaLocal(dia);
  const mapaApi = new Map<string, SlotDto>();
  for (const s of slots) {
    const { fecha, hora } = slotAFechaHoraLocal(s);
    if (fecha === fechaYmd) {
      mapaApi.set(hora, s);
    }
  }

  const inicioMin = HORA_INICIO_LABORAL * 60;
  const finMin = HORA_FIN_LABORAL * 60;
  const celdas: CeldaHorario[] = [];

  for (let t = inicioMin; t < finMin; t += INTERVALO_MINUTOS) {
    const h = Math.floor(t / 60);
    const min = t % 60;
    const hora = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const slot = mapaApi.get(hora) ?? null;
    const mockBloquea = enMockOcupadas(fechaYmd, hora);
    const disponible = Boolean(slot) && !mockBloquea;
    const dEtiqueta = new Date(2000, 0, 1, h, min);
    const etiqueta = dEtiqueta.toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    celdas.push({
      hora,
      etiqueta,
      disponible,
      slot: disponible ? slot : null,
    });
  }
  return celdas;
}
