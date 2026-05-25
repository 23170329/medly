import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaDetalleConsultaCompleta } from "../../../../componentes/medico/PantallaDetalleConsultaCompleta";

function parseCitaId(raw: string | string[] | undefined): number {
  const id = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(id ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export default function ExpedienteConsultaDetalleRuta(): React.JSX.Element {
  const { citaId, nombrePaciente } = useLocalSearchParams<{
    citaId: string | string[];
    nombrePaciente?: string | string[];
  }>();

  const cid = parseCitaId(citaId);
  const nombre =
    typeof nombrePaciente === "string"
      ? nombrePaciente
      : Array.isArray(nombrePaciente)
        ? nombrePaciente[0]
        : undefined;

  return (
    <PantallaDetalleConsultaCompleta
      citaId={cid}
      nombrePaciente={nombre}
    />
  );
}
