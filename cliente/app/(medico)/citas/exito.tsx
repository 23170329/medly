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

export default function CitaExitoMedico(): React.JSX.Element {
  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.contenido}>
        <View style={estilos.circulo}>
          <Ionicons name="checkmark" size={48} color={paleta.green} />
        </View>
        <Text style={estilos.titulo}>CITA EXITOSA</Text>
        <Text style={estilos.sub}>
          La consulta quedó registrada en el expediente del paciente.
        </Text>
        <TouchableOpacity
          style={estilos.btn}
          onPress={() => router.replace("/(medico)")}
        >
          <Text style={estilos.btnTxt}>VOLVER AL INICIO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  contenido: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  circulo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: paleta.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: paleta.green,
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
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  btnTxt: { color: paleta.white, fontWeight: "800" },
});
