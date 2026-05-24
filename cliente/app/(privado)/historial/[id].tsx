import React, { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaHistorialDetalle } from "../../../componentes/citas/PantallaHistorialDetalle";
import { fetchHistorialDetallePaciente } from "../../../lib/medlyApi";

export default function HistorialDetallePaciente(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const citaId = parseInt(id ?? "0", 10);

  const cargarDetalle = useCallback(async () => {
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
