import React from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, BORDES } from "../../constants/theme";

interface EntradaProps extends TextInputProps {
  etiqueta: string;
  icono?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export const Entrada = ({ etiqueta, icono, error, ...props }: EntradaProps) => {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.contenedorInput, error && styles.inputError]}>
        {icono && (
          <Ionicons
            name={icono}
            size={20}
            color={COLORES.primario}
            style={styles.icono}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor="#A0A0A0"
          {...props}
        />
      </View>
      {error && <Text style={styles.textoError}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
    width: "100%",
  },
  etiqueta: {
    fontSize: 12,
    color: COLORES.texto,
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  contenedorInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.blanco,
    borderRadius: BORDES.radio,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
  },
  inputError: {
    borderColor: COLORES.peligro,
  },
  icono: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORES.texto,
    fontSize: 14,
  },
  textoError: {
    color: COLORES.peligro,
    fontSize: 12,
    marginTop: 4,
  },
});
