import React, { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaHistorialDetalle } from "../../../componentes/citas/PantallaHistorialDetalle";
import { fetchHistorialDetalleMedico, nombrePaciente } from "../../../lib/medicoApi";
import { useAuthStore } from "../../../stores/auth.store";

export default function HistorialDetalleMedico(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.accessToken);
  const citaId = parseInt(id ?? "0", 10);

  const cargarDetalle = useCallback(async () => {
    if (!token) throw new Error("Sin sesión");
    const data = await fetchHistorialDetalleMedico(token, citaId);
    return { cita: data.cita, consulta: data.consulta };
  }, [token, citaId]);

  return (
    <PantallaHistorialDetalle
      titulo="DETALLE DE CITA"
      rol="medico"
      cargarDetalle={cargarDetalle}
      subtituloPersona={(c) => nombrePaciente(c.paciente)}
    />
  );
}
