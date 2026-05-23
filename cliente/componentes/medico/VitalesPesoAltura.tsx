import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Entrada } from "../comunes/Entrada";

interface VitalesPesoAlturaProps {
  readonly pesoKg: string;
  readonly alturaM: string;
  readonly onPesoChange: (v: string) => void;
  readonly onAlturaChange: (v: string) => void;
  readonly errorPeso?: string;
  readonly errorAltura?: string;
}

export function VitalesPesoAltura({
  pesoKg,
  alturaM,
  onPesoChange,
  onAlturaChange,
  errorPeso,
  errorAltura,
}: VitalesPesoAlturaProps): React.JSX.Element {
  return (
    <View style={estilos.fila}>
      <View style={estilos.mitad}>
        <Entrada
          etiqueta="PESO"
          placeholder="70 Kg"
          value={pesoKg}
          onChangeText={(t) => onPesoChange(t.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          mensajeError={errorPeso}
        />
      </View>
      <View style={estilos.mitad}>
        <Entrada
          etiqueta="ALTURA"
          placeholder="1.80 m"
          value={alturaM}
          onChangeText={(t) => onAlturaChange(t.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          mensajeError={errorAltura}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", gap: 12, marginBottom: 4 },
  mitad: { flex: 1 },
});
