import React from "react";
import { PantallaHistorialCitas } from "../../../componentes/citas/PantallaHistorialCitas";
import { fetchHistorialPaciente } from "../../../lib/medlyApi";

export default function HistorialPaciente(): React.JSX.Element {
  return (
    <PantallaHistorialCitas
      titulo="HISTORIAL DE CITAS"
      rol="paciente"
      cargarLista={fetchHistorialPaciente}
      rutaDetalle={(id) => `/(privado)/historial/${id}`}
    />
  );
}
