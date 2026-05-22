import React, { useCallback, useState } from "react";
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

export default function RecepcionAgenda(): React.JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.accessToken);
  const [citas, setCitas] = useState<CitaMedicoDto[]>([]);
  const [loading, setLoading] = useState(true);

  const nombreCorto = usuario?.nombre?.split(" ")[0] ?? "Recepción";
  const inicial = (usuario?.nombre?.[0] ?? "R").toUpperCase();

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

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void cargar()} />
        }
      >
        <EncabezadoPaciente
          nombreCorto={nombreCorto}
          inicial={inicial}
          onPerfil={() => router.push("/(recepcion)/perfil")}
        />

        <Text style={estilos.tituloSec}>AGENDA</Text>

        {citas.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons name="calendar-outline" size={56} color={paleta.skyblue} />
            <Text style={estilos.vacioTit}>¡Todo al día!</Text>
            <Text style={estilos.vacioSub}>
              No hay citas programadas. Agenda una nueva desde el inicio.
            </Text>
            <TouchableOpacity
              style={estilos.btnAgendar}
              onPress={() => router.push("/(recepcion)/citas/agendar")}
            >
              <Text style={estilos.btnAgendarTxt}>AGENDAR NUEVA CITA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          citas.map((c) => {
            const ini = new Date(c.inicio);
            return (
              <TouchableOpacity key={c.citaID} style={estilos.fila} activeOpacity={0.7}>
                <View style={estilos.filaIzq}>
                  <Text style={estilos.fecha}>
                    {ini
                      .toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                      .toUpperCase()}
                  </Text>
                  <Text style={estilos.hora}>
                    {ini.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.consulta}>Consulta médica</Text>
                  <Text style={estilos.paciente}>{nombrePaciente(c.paciente)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={paleta.teal} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  tituloSec: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: paleta.teal,
    marginBottom: 12,
  },
  vacio: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  vacioTit: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 16,
  },
  vacioSub: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  btnAgendar: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  btnAgendarTxt: {
    color: paleta.white,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
  },
  filaIzq: { alignItems: "center", minWidth: 72 },
  fecha: { fontSize: 11, fontWeight: "800", color: paleta.teal },
  hora: { fontSize: 15, fontWeight: "700", color: paleta.navy, marginTop: 2 },
  consulta: { fontSize: 14, fontWeight: "700", color: paleta.navy },
  paciente: { fontSize: 12, color: paleta.teal, marginTop: 2 },
});
