import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";
import { crearCitaMostradorRecepcion } from "../../../lib/recepcionApi";

const CLABE_DEMO = "012180001234567890";
const BANCO_DEMO = "BBVA México";

export default function RecepcionCitaPendiente(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const params = useLocalSearchParams<{
    pacienteId?: string;
    slotID?: string;
    paciente?: string;
    medico?: string;
    especialidad?: string;
    inicio?: string;
    anticipo?: string;
    total?: string;
    sucursal?: string;
  }>();
  const [cargando, setCargando] = useState(false);

  const anticipo = params.anticipo ?? "0";

  const copiarClabe = (): void => {
    Alert.alert("CLABE", CLABE_DEMO);
  };

  const marcarReflejado = async (): Promise<void> => {
    const pid = parseInt(params.pacienteId ?? "", 10);
    const sid = parseInt(params.slotID ?? "", 10);
    if (!pid || !sid || !token) {
      Alert.alert("Error", "Datos de cita incompletos.");
      return;
    }
    setCargando(true);
    try {
      const cita = await crearCitaMostradorRecepcion(token, pid, sid);
      router.replace({
        pathname: "/(recepcion)/citas/confirmada",
        params: {
          citaId: String(cita.citaID),
          paciente: params.paciente ?? "",
          medico: params.medico ?? "",
          especialidad: params.especialidad ?? "",
          inicio: cita.inicio,
          total: cita.montoTotal,
          sucursal: params.sucursal ?? "",
        },
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo confirmar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico titulo="PAGO PENDIENTE" onAtras={() => router.back()} />

        <View style={estilos.banner}>
          <Ionicons name="time-outline" size={48} color={paleta.navy} />
          <Text style={estilos.bannerTit}>Anticipo pendiente</Text>
          <Text style={estilos.bannerSub}>
            Indica al paciente que debe transferir al menos el 50% (${anticipo} MXN) en
            las próximas 2 horas para confirmar la cita.
          </Text>
        </View>

        <View style={estilos.datosBanco}>
          <Text style={estilos.datosTit}>DATOS PARA TRANSFERENCIA</Text>
          <Text style={estilos.datoLabel}>Banco</Text>
          <Text style={estilos.datoValor}>{BANCO_DEMO}</Text>
          <Text style={estilos.datoLabel}>CLABE</Text>
          <View style={estilos.clabeFila}>
            <Text style={estilos.datoValor}>{CLABE_DEMO}</Text>
            <TouchableOpacity onPress={copiarClabe} style={estilos.copiar}>
              <Ionicons name="copy-outline" size={20} color={paleta.teal} />
            </TouchableOpacity>
          </View>
          <Text style={estilos.datoLabel}>Concepto</Text>
          <Text style={estilos.datoValor}>
            Anticipo cita · {params.paciente ?? "Paciente"}
          </Text>
        </View>

        <TouchableOpacity
          style={estilos.btnOk}
          disabled={cargando}
          onPress={() => void marcarReflejado()}
        >
          {cargando ? (
            <ActivityIndicator color={paleta.white} />
          ) : (
            <Text style={estilos.btnOkTxt}>MARCAR COMO REFLEJADO</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: {
    backgroundColor: "#F9E79F",
    borderRadius: BORDES.radio,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  bannerTit: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    marginTop: 12,
  },
  bannerSub: {
    fontSize: 14,
    color: paleta.navy,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  datosBanco: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 18,
    marginBottom: 24,
  },
  datosTit: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  datoLabel: { fontSize: 12, color: paleta.teal, marginTop: 8 },
  datoValor: { fontSize: 15, fontWeight: "700", color: paleta.navy, marginTop: 2 },
  clabeFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  copiar: { padding: 8 },
  btnOk: {
    backgroundColor: "#4CAF50",
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnOkTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
});
