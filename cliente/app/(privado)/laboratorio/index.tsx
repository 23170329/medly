import React from "react";
import { PantallaResultadosClinicos } from "../../../componentes/paciente/PantallaResultadosClinicos";

export default function LaboratorioPaciente(): React.JSX.Element {
  return (
    <PantallaResultadosClinicos
      titulo="LABORATORIO"
      tipo="laboratorio"
      vacioTitulo="Sin estudios"
      vacioSub="Los resultados de laboratorio que registre tu médico aparecerán en esta sección."
      iconoVacio="flask-outline"
    />
  );
}
