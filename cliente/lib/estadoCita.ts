import type { CitaDto, EstadoCitaApi } from "./medlyApi";

export function anticipoCompletado(cita: CitaDto): boolean {
  return (cita.pagos ?? []).some(
    (p) => p.tipo === "ANTICIPO_50" && p.estado === "COMPLETADO",
  );
}

export function etiquetaEstadoCita(cita: CitaDto): string {
  if (cita.estado === "ANTICIPO_REALIZADO") {
    return "Anticipo realizado";
  }
  if (cita.estado === "CONFIRMADA" && anticipoCompletado(cita)) {
    return "Anticipo realizado";
  }
  if (cita.estado === "PENDIENTE_PAGO") {
    return "Pendiente de pago (50%)";
  }
  if (cita.estado === "CONFIRMADA") {
    return "Confirmada";
  }
  if (cita.estado === "CANCELADA") {
    return "Cancelada";
  }
  if (cita.estado === "COMPLETADA") {
    return "Completada";
  }
  return cita.estado.replace(/_/g, " ");
}

export function esCitaActivaFutura(estado: EstadoCitaApi): boolean {
  return (
    estado === "CONFIRMADA" ||
    estado === "PENDIENTE_PAGO" ||
    estado === "ANTICIPO_REALIZADO"
  );
}
