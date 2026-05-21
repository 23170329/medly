import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";

export default function RecepcionInicio(): React.JSX.Element {
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);

  return (
    <SafeAreaView style={estilos.area}>
      <Text style={estilos.titulo}>Recepción</Text>
      <Text style={estilos.sub}>
        Registro de pacientes y citas en mostrador (demo: recepcion@medly.r).
      </Text>

      <TouchableOpacity
        style={estilos.btn}
        onPress={() => router.push("/(recepcion)/registrar-paciente")}
      >
        <Text style={estilos.btnTxt}>Registrar paciente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.btn}
        onPress={() => router.push("/(recepcion)/agendar-cita")}
      >
        <Text style={estilos.btnTxt}>Cita en mostrador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.btnSec}
        onPress={async () => {
          await cerrarSesion();
          router.replace("/(auth)/iniciar-sesion");
        }}
      >
        <Text style={estilos.btnSecTxt}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo, padding: 24 },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: paleta.navy,
    marginBottom: 8,
  },
  sub: { fontSize: 14, color: paleta.teal, marginBottom: 28 },
  btn: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  btnTxt: { color: paleta.white, fontWeight: "700", fontSize: 15 },
  btnSec: {
    marginTop: 32,
    borderWidth: 1.5,
    borderColor: paleta.teal,
    borderRadius: BORDES.radioPill,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecTxt: { color: paleta.teal, fontWeight: "700" },
});
