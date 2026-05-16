import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";

const OPCIONES = [
  { id: "t", label: "Términos de Servicio" },
  { id: "p", label: "Política de Privacidad" },
  { id: "c", label: "Uso de Cookies" },
] as const;

const CONTENIDO: Record<string, string> = {
  t: "Medly ofrece la plataforma «tal cual». El uso del servicio implica aceptar estas condiciones y las leyes aplicables en México.",
  p: "Tratamos tus datos personales conforme a la LFPDPPP. Puedes ejercer ARCO contactando a soporte desde la app.",
  c: "Usamos cookies técnicas necesarias para la sesión y analíticas agregadas para mejorar la experiencia.",
};

export default function LegalPantalla(): React.JSX.Element {
  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.top}>
        <TouchableOpacity
          style={estilos.btnAtras}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>LEGAL</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        {OPCIONES.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={estilos.fila}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(o.label, CONTENIDO[o.id] ?? "", [{ text: "Cerrar" }])
            }
          >
            <Text style={estilos.filaTxt}>{o.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={paleta.teal} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  btnAtras: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.8,
  },
  scroll: { padding: 24 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  filaTxt: { fontSize: 15, fontWeight: "600", color: paleta.navy, flex: 1 },
});
