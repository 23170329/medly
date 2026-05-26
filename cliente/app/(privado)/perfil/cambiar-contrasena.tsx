import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";

export default function PantallaCambiarContrasena(): React.JSX.Element {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={estilos.back}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Cambiar Contraseña</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.card}>
          <Campo
            label="Contraseña actual"
            value={actual}
            onChangeText={setActual}
            placeholder="Ingresa tu contraseña actual"
            secureTextEntry
          />
          <Campo
            label="Nueva contraseña"
            value={nueva}
            onChangeText={setNueva}
            placeholder="Ingresa tu nueva contraseña"
            secureTextEntry
          />
          <Campo
            label="Confirmar nueva contraseña"
            value={confirmar}
            onChangeText={setConfirmar}
            placeholder="Vuelve a escribir tu nueva contraseña"
            secureTextEntry
          />

          <TouchableOpacity
            style={estilos.btn}
            onPress={() => {
              // TODO: conectar con backend (validar actual, hashear nueva, etc.)
            }}
            accessibilityRole="button"
            accessibilityLabel="Actualizar contraseña"
          >
            <Text style={estilos.btnTxt}>ACTUALIZAR CONTRASEÑA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}): React.JSX.Element {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoLabel}>{label}</Text>
      <TextInput
        style={estilos.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORES.textoPlaceholder}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 0.5,
  },
  scroll: { padding: 24, paddingBottom: 48 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  campo: { marginBottom: 14 },
  campoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    backgroundColor: paleta.beige,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: paleta.navy,
  },
  btn: {
    marginTop: 10,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnTxt: {
    color: paleta.white,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

