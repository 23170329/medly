import React from "react";
import { PantallaHistorialCitas } from "../../../componentes/citas/PantallaHistorialCitas";
import { fetchHistorialMedico } from "../../../lib/medicoApi";
import { useAuthStore } from "../../../stores/auth.store";

export default function HistorialMedico(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);

  return (
    <PantallaHistorialCitas
      titulo="HISTORIAL DE CITAS"
      rol="medico"
      cargarLista={async () => {
        if (!token) return [];
        return fetchHistorialMedico(token);
      }}
      rutaDetalle={(id) => `/(medico)/historial/${id}`}
    />
  );
}
