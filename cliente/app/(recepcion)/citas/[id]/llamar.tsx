import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../../constants/theme";

export default function RecepcionLlamarConfirmar(): React.JSX.Element {
  const params = useLocalSearchParams<{
    id?: string;
    telefono?: string;
    paciente?: string;
  }>();

  const tel = (params.telefono ?? "").replace(/\D/g, "");
  const telUri = tel.length === 10 ? `tel:+52${tel}` : tel ? `tel:${tel}` : "";

  const llamar = (): void => {
    if (!telUri) {
      Alert.alert("Sin teléfono", "Este paciente no tiene número registrado.");
      return;
    }
    void Linking.openURL(telUri);
  };

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.centro}>
        <EncabezadoPantallaMedico
          titulo="CONFIRMAR CITA"
          onAtras={() => router.back()}
        />

        <View style={estilos.icono}>
          <Ionicons name="call" size={40} color={paleta.white} />
        </View>

        <Text style={estilos.paciente}>{params.paciente ?? "Paciente"}</Text>
        <Text style={estilos.sub}>
          Llama al paciente para confirmar asistencia a la consulta.
        </Text>
        {tel ? (
          <Text style={estilos.tel}>{params.telefono}</Text>
        ) : (
          <Text style={estilos.sinTel}>No hay teléfono registrado</Text>
        )}

        <TouchableOpacity
          style={[estilos.btn, !tel && estilos.btnOff]}
          disabled={!tel}
          onPress={llamar}
        >
          <Text style={estilos.btnTxt}>LLAMAR AHORA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnSec}
          onPress={() =>
            router.push({
              pathname: "/(recepcion)/citas/[id]",
              params: { id: params.id ?? "" },
            })
          }
        >
          <Text style={estilos.btnSecTxt}>VER DETALLE DE LA CITA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  centro: { flex: 1, padding: 24 },
  icono: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: paleta.navy,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  paciente: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.navy,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  tel: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    textAlign: "center",
    marginTop: 16,
  },
  sinTel: {
    fontSize: 14,
    color: paleta.red,
    textAlign: "center",
    marginTop: 16,
  },
  btn: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  btnOff: { opacity: 0.45 },
  btnTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
  btnSec: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSecTxt: { color: paleta.teal, fontWeight: "700", fontSize: 13 },
});
