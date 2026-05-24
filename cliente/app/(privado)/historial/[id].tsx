import React, { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaHistorialDetalle } from "../../../componentes/citas/PantallaHistorialDetalle";
import { fetchHistorialDetallePaciente } from "../../../lib/medlyApi";

function parseCitaId(raw: string | string[] | undefined): number {
  const id = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(id ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export default function HistorialDetallePaciente(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const citaId = parseCitaId(id);

  const cargarDetalle = useCallback(async () => {
    if (citaId < 1) throw new Error("Cita no válida");
    const data = await fetchHistorialDetallePaciente(citaId);
    return {
      cita: data.cita,
      consulta: data.consulta,
    };
  }, [citaId]);

  return (
    <PantallaHistorialDetalle
      titulo="DETALLE DE CITA"
      rol="paciente"
      cargarDetalle={cargarDetalle}
      subtituloPersona={(c) =>
        c.medico
          ? `${c.medico.nombre} ${c.medico.apellidoPat}`.trim()
          : "Médico"
      }
    />
  );
}
