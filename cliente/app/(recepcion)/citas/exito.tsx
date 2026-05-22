import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";

export default function RecepcionExito(): React.JSX.Element {
  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.centro}>
        <View style={estilos.circulo}>
          <Ionicons name="checkmark" size={48} color={paleta.white} />
        </View>
        <Text style={estilos.titulo}>REGISTRO EXITOSO</Text>
        <Text style={estilos.sub}>
          Tu registro se ha completado exitosamente.
        </Text>
        <TouchableOpacity
          style={estilos.btn}
          onPress={() => router.replace("/(recepcion)")}
        >
          <Text style={estilos.btnTxt}>VOLVER AL INICIO</Text>
          <Ionicons name="arrow-forward" size={18} color={paleta.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  circulo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 32,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  btnTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
});
