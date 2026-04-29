import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORES, BORDES } from "../../constants/theme";

interface BotonProps {
  titulo: string;
  alPresionar: () => void;
  tipo?: "primario" | "peligro" | "secundario";
  cargando?: boolean;
}

export const Boton = ({
  titulo,
  alPresionar,
  tipo = "primario",
  cargando = false,
}: BotonProps) => {
  const colorFondo =
    tipo === "peligro"
      ? COLORES.peligro
      : tipo === "secundario"
        ? COLORES.grisClaro
        : COLORES.primario;

  return (
    <TouchableOpacity
      style={[styles.boton, { backgroundColor: colorFondo }]}
      onPress={alPresionar}
      disabled={cargando}
    >
      {cargando ? (
        <ActivityIndicator color={COLORES.blanco} />
      ) : (
        <Text style={styles.texto}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  boton: {
    paddingVertical: 15,
    borderRadius: BORDES.radio,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  texto: {
    color: COLORES.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
