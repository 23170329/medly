const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"] as const;

export function etiquetasDiasSemana(): readonly string[] {
  return DIAS_SEMANA;
}

export function inicioMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

export function finMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
}

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function normalizarDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function diasMatrizCalendario(mesVisible: Date): Date[] {
  const primero = inicioMes(mesVisible);
  const ultimo = finMes(mesVisible);
  const inicioGrid = new Date(primero);
  inicioGrid.setDate(primero.getDate() - primero.getDay());

  const finGrid = new Date(ultimo);
  finGrid.setDate(ultimo.getDate() + (6 - ultimo.getDay()));

  const dias: Date[] = [];
  const cursor = new Date(inicioGrid);
  while (cursor <= finGrid) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export function tituloMes(fecha: Date): string {
  const t = fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function diaEnRango(
  dia: Date,
  inicio: Date | null,
  fin: Date | null,
): boolean {
  if (!inicio || !fin) return false;
  const t = normalizarDia(dia).getTime();
  const a = normalizarDia(inicio).getTime();
  const b = normalizarDia(fin).getTime();
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return t >= min && t <= max;
}

export function esExtremoRango(
  dia: Date,
  inicio: Date | null,
  fin: Date | null,
): "inicio" | "fin" | null {
  if (!inicio || !fin) return inicio && mismoDia(dia, inicio) ? "inicio" : null;
  const a = normalizarDia(inicio);
  const b = normalizarDia(fin);
  if (mismoDia(dia, a)) return "inicio";
  if (mismoDia(dia, b)) return "fin";
  return null;
}

export function avanzarMes(fecha: Date, delta: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + delta, 1);
}
