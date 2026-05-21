import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, BORDES } from "../../constants/theme";

interface EntradaProps extends TextInputProps {
  etiqueta: string;
  icono?: keyof typeof Ionicons.glyphMap;
  error?: string;
  mensajeError?: string;
  /** Muestra icono de ojo para contraseñas */
  permitirVerContrasena?: boolean;
}

export const Entrada = ({
  etiqueta,
  icono,
  error,
  mensajeError,
  permitirVerContrasena,
  secureTextEntry,
  ...props
}: EntradaProps) => {
  const msg = error ?? mensajeError;
  const [visible, setVisible] = useState(false);
  const esContrasena = Boolean(permitirVerContrasena || secureTextEntry);
  const ocultar = esContrasena && !visible;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.contenedorInput, msg && styles.inputError]}>
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
          placeholderTextColor={COLORES.textoPlaceholder}
          secureTextEntry={ocultar}
          {...props}
        />
        {esContrasena && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORES.primario}
            />
          </TouchableOpacity>
        )}
      </View>
      {msg && <Text style={styles.textoError}>{msg}</Text>}
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
