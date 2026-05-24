import React, { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaHistorialDetalle } from "../../../componentes/citas/PantallaHistorialDetalle";
import { fetchHistorialDetalleMedicoAuthed, nombrePaciente } from "../../../lib/medicoApi";

function parseCitaId(raw: string | string[] | undefined): number {
  const id = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(id ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export default function HistorialDetalleMedico(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const citaId = parseCitaId(id);

  const cargarDetalle = useCallback(async () => {
    if (citaId < 1) throw new Error("Cita no válida");
    const data = await fetchHistorialDetalleMedicoAuthed(citaId);
    return { cita: data.cita, consulta: data.consulta };
  }, [citaId]);

  return (
    <PantallaHistorialDetalle
      titulo="DETALLE DE CITA"
      rol="medico"
      cargarDetalle={cargarDetalle}
      subtituloPersona={(c) => nombrePaciente(c.paciente)}
    />
  );
}
