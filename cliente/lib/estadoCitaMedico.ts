export interface BadgeEstadoCitaMedico {
  etiqueta: string;
  color: string;
  fondo: string;
  icono: "time-outline" | "cash-outline" | "checkmark-circle-outline";
}

export function badgeEstadoCitaMedico(estado: string): BadgeEstadoCitaMedico {
  if (estado === "ANTICIPO_REALIZADO") {
    return {
      etiqueta: "Anticipo realizado",
      color: "#2E7D32",
      fondo: "#DCF0E4",
      icono: "cash-outline",
    };
  }
  if (estado === "CONFIRMADA") {
    return {
      etiqueta: "Confirmada",
      color: "#2E7D32",
      fondo: "#DCF0E4",
      icono: "checkmark-circle-outline",
    };
  }
  return {
    etiqueta: "Pendiente de pago",
    color: "#D97706",
    fondo: "#FEF3C7",
    icono: "time-outline",
  };
}
