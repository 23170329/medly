import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { paleta } from "../../constants/theme";

interface EncabezadoPantallaMedicoProps {
  readonly titulo: string;
  readonly onAtras?: () => void;
}

export function EncabezadoPantallaMedico({
  titulo,
  onAtras,
}: EncabezadoPantallaMedicoProps): React.JSX.Element {
  return (
    <View style={estilos.fila}>
      {onAtras ? (
        <TouchableOpacity
          onPress={onAtras}
          style={estilos.atras}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={26} color={paleta.navy} />
        </TouchableOpacity>
      ) : (
        <View style={estilos.atras} />
      )}
      <Text style={estilos.titulo}>{titulo}</Text>
      <View style={estilos.atras} />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  atras: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: paleta.navy,
  },
});
