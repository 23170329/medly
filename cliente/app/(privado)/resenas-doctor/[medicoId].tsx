import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PantallaResenasDoctor } from "../../../componentes/paciente/PantallaResenasDoctor";

function parseId(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export default function ResenasDoctorRuta(): React.JSX.Element {
  const { medicoId, nombre } = useLocalSearchParams<{
    medicoId: string | string[];
    nombre?: string | string[];
  }>();

  const id = parseId(medicoId);
  const nombreDoctor =
    typeof nombre === "string"
      ? nombre
      : Array.isArray(nombre)
        ? nombre[0]
        : undefined;

  return <PantallaResenasDoctor medicoId={id} nombreDoctor={nombreDoctor} />;
}

