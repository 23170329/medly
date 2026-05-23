import React from "react";
import { PantallaResultadosClinicos } from "../../../componentes/paciente/PantallaResultadosClinicos";

export default function DiagnosticoPaciente(): React.JSX.Element {
  return (
    <PantallaResultadosClinicos
      titulo="DIAGNÓSTICOS"
      tipo="diagnostico"
      vacioTitulo="Sin diagnósticos"
      vacioSub="Cuando tu médico registre un diagnóstico en consulta, lo verás aquí."
      iconoVacio="pulse-outline"
    />
  );
}
