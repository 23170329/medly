import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { paleta, BORDES } from "../../constants/theme";

interface SeccionFormularioProps {
  readonly titulo: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly children: React.ReactNode;
}

export function SeccionFormulario({
  titulo,
  icono,
  children,
}: SeccionFormularioProps): React.JSX.Element {
  return (
    <View style={estilos.seccion}>
      <View style={estilos.header}>
        <Ionicons name={icono} size={18} color={paleta.teal} />
        <Text style={estilos.titulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: paleta.skyblue,
  },
  titulo: {
    fontSize: 13,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.3,
  },
});
