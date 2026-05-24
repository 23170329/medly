import React from "react";
import { PantallaHistorialCitas } from "../../../componentes/citas/PantallaHistorialCitas";
import { fetchHistorialMedicoAuthed } from "../../../lib/medicoApi";

export default function HistorialMedico(): React.JSX.Element {
  return (
    <PantallaHistorialCitas
      titulo="HISTORIAL DE CITAS"
      rol="medico"
      cargarLista={fetchHistorialMedicoAuthed}
      rutaDetalle={(id) => ({
        pathname: "/(medico)/historial/[id]",
        params: { id: String(id) },
      })}
    />
  );
}
