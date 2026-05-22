import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../constants/theme";

export default function RecepcionCitaConfirmada(): React.JSX.Element {
  const params = useLocalSearchParams<{
    citaId?: string;
    paciente?: string;
    medico?: string;
    especialidad?: string;
    inicio?: string;
    total?: string;
    anticipo?: string;
    mensaje?: string;
    sucursal?: string;
  }>();

  const fechaTxt =
    params.inicio != null
      ? new Date(params.inicio).toLocaleString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const llamar = (): void => {
    Alert.alert(
      "Confirmar llamada",
      "¿Llamar al paciente para confirmar la cita?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Llamar",
          onPress: () => void Linking.openURL("tel:"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.banner}>
          <Ionicons name="checkmark-circle" size={56} color={paleta.white} />
          <Text style={estilos.bannerTit}>Anticipo registrado</Text>
          <Text style={estilos.bannerSub}>
            {params.mensaje ??
              "El anticipo del 50% se registró correctamente en mostrador."}
          </Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.cardMed}>{params.medico}</Text>
          <Text style={estilos.cardSub}>{params.especialidad}</Text>
          <Text style={estilos.cardSub}>{fechaTxt}</Text>
          <Text style={estilos.cardSub}>{params.sucursal}</Text>
          <Text style={estilos.cardPac}>{params.paciente}</Text>
          {params.anticipo != null && (
            <Text style={estilos.cardAnticipo}>
              Anticipo pagado: ${params.anticipo} MXN
            </Text>
          )}
          {params.total != null && (
            <Text style={estilos.cardPrecio}>Total consulta: ${params.total} MXN</Text>
          )}
        </View>

        <TouchableOpacity style={estilos.btnLlamar} onPress={llamar}>
          <Ionicons name="call-outline" size={20} color={paleta.white} />
          <Text style={estilos.btnLlamarTxt}>LLAMAR PARA CONFIRMAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnInicio}
          onPress={() => router.replace("/(recepcion)")}
        >
          <Text style={estilos.btnInicioTxt}>VOLVER AL INICIO</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: {
    backgroundColor: "#4CAF50",
    borderRadius: BORDES.radio,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  bannerTit: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.white,
    marginTop: 12,
  },
  bannerSub: {
    fontSize: 14,
    color: paleta.white,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    opacity: 0.95,
  },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 18,
    marginBottom: 20,
  },
  cardMed: { fontSize: 17, fontWeight: "800", color: paleta.navy },
  cardSub: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  cardPac: { fontSize: 15, fontWeight: "700", color: paleta.navy, marginTop: 12 },
  cardAnticipo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 10,
  },
  cardPrecio: { fontSize: 16, fontWeight: "600", color: paleta.teal, marginTop: 4 },
  btnLlamar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    marginBottom: 12,
  },
  btnLlamarTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
  btnInicio: {
    borderWidth: 2,
    borderColor: paleta.teal,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnInicioTxt: { color: paleta.teal, fontWeight: "700", fontSize: 14 },
});
