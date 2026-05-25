import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaDetalleExpediente } from "../../../componentes/medico/PantallaDetalleExpediente";

export default function ExpedienteDetalleRuta(): React.JSX.Element {
  const { pacienteId, nombre } = useLocalSearchParams<{
    pacienteId: string;
    nombre?: string;
  }>();
  const pid = parseInt(pacienteId ?? "0", 10);

  return (
    <PantallaDetalleExpediente
      pacienteId={pid}
      nombreInicial={typeof nombre === "string" ? nombre : undefined}
    />
  );
}
