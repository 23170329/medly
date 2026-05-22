import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPaciente } from "../../componentes/layout/EncabezadoPaciente";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import { fetchCitasRecepcion } from "../../lib/recepcionApi";
import { nombrePaciente, type CitaMedicoDto } from "../../lib/medicoApi";

export default function RecepcionInicio(): React.JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.accessToken);
  const [citas, setCitas] = useState<CitaMedicoDto[]>([]);
  const [loading, setLoading] = useState(true);

  const nombreCorto = usuario?.nombre?.split(" ")[0] ?? "Recepción";
  const inicial = (usuario?.nombre?.[0] ?? "R").toUpperCase();

  const proxima = useMemo(() => {
    const orden = [...citas].sort(
      (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
    );
    return orden[0] ?? null;
  }, [citas]);

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchCitasRecepcion(token);
      setCitas(Array.isArray(data) ? data : []);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const fechaProx = proxima ? new Date(proxima.inicio) : null;

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void cargar()} />
        }
        showsVerticalScrollIndicator={false}
      >
        <EncabezadoPaciente
          nombreCorto={nombreCorto}
          inicial={inicial}
          onPerfil={() => router.push("/(recepcion)/perfil")}
        />

        <Text style={estilos.sec}>PRÓXIMA CITA</Text>
        {proxima && fechaProx ? (
          <View style={estilos.cardProxima}>
            <View style={estilos.cardProximaFecha}>
              <Text style={estilos.cardMes}>
                {fechaProx
                  .toLocaleDateString("es-MX", { month: "short" })
                  .toUpperCase()
                  .replace(".", "")}
              </Text>
              <Text style={estilos.cardDia}>{fechaProx.getDate()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.cardHora}>
                {fechaProx.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={estilos.cardNombre}>
                {nombrePaciente(proxima.paciente)}
              </Text>
              <Text style={estilos.cardSub}>
                {proxima.medico?.especialidad?.nombre ?? "Consulta"} ·{" "}
                {proxima.sucursal?.nombre ?? "Sucursal"}
              </Text>
            </View>
          </View>
        ) : (
          <View style={estilos.cardVacio}>
            <Text style={estilos.cardVacioTxt}>No hay citas próximas programadas.</Text>
          </View>
        )}

        <TouchableOpacity
          style={estilos.btnBlanco}
          onPress={() => router.push("/(recepcion)/registrar-paciente")}
        >
          <View style={estilos.btnIcono}>
            <Ionicons name="person-add-outline" size={22} color={paleta.navy} />
          </View>
          <Text style={estilos.btnBlancoTxt}>REGISTRAR PACIENTE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnBlanco}
          onPress={() => router.push("/(recepcion)/citas/agendar")}
        >
          <View style={estilos.btnIcono}>
            <Ionicons name="calendar-outline" size={22} color={paleta.navy} />
          </View>
          <Text style={estilos.btnBlancoTxt}>AGENDAR CITA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  sec: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: paleta.teal,
    marginBottom: 10,
  },
  cardProxima: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio + 2,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  cardProximaFecha: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  cardMes: { fontSize: 11, fontWeight: "700", color: paleta.skyblue },
  cardDia: { fontSize: 22, fontWeight: "800", color: paleta.white },
  cardHora: { fontSize: 13, color: paleta.skyblue, fontWeight: "600" },
  cardNombre: {
    fontSize: 17,
    fontWeight: "700",
    color: paleta.white,
    marginTop: 2,
  },
  cardSub: { fontSize: 13, color: paleta.skyblue, marginTop: 4 },
  cardVacio: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 20,
  },
  cardVacioTxt: { color: paleta.teal, fontSize: 14 },
  btnBlanco: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  btnIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBlancoTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.4,
  },
});
