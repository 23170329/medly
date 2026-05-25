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
import {
  fetchCitasPendientesMedico,
  nombrePaciente,
  type CitaMedicoDto,
} from "../../lib/medicoApi";

export default function MedicoAgenda(): React.JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.accessToken);
  const [citas, setCitas] = useState<CitaMedicoDto[]>([]);
  const [loading, setLoading] = useState(true);

  const nombreCorto = usuario?.nombre?.split(" ")[0] ?? "Doctor";
  const inicial = (usuario?.nombre?.[0] ?? "D").toUpperCase();

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchCitasPendientesMedico(token);
      const pendientes = (Array.isArray(data) ? data : []).filter(
        (c) =>
          c.estado !== "CANCELADA" &&
          c.estado !== "COMPLETADA",
      );
      pendientes.sort(
        (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
      );
      setCitas(pendientes);
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
          onPerfil={() => router.push("/(medico)/perfil")}
        />

        <Text style={estilos.tituloSec}>AGENDA</Text>

        {citas.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons name="calendar-outline" size={56} color={paleta.skyblue} />
            <Text style={estilos.vacioTit}>¡Todo al día!</Text>
            <Text style={estilos.vacioSub}>
              No tienes citas pendientes por atender.
            </Text>
          </View>
        ) : (
          citas.map((c) => {
            const ini = new Date(c.inicio);
            return (
              <TouchableOpacity
                key={c.citaID}
                style={estilos.fila}
                onPress={() =>
                  router.push({
                    pathname: "/(medico)/citas/[id]",
                    params: { id: String(c.citaID) },
                  })
                }
              >
                <View style={estilos.filaIzq}>
                  <Text style={estilos.fecha}>
                    {ini.toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                  <Text style={estilos.hora}>
                    {ini.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View style={estilos.filaCentro}>
                  <Text style={estilos.paciente}>{nombrePaciente(c.paciente)}</Text>
                  <Text style={estilos.esp}>
                    {c.medico?.especialidad?.nombre ?? "Consulta médica"}
                  </Text>
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
    marginBottom: 14,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  filaIzq: { minWidth: 88 },
  fecha: { fontSize: 12, fontWeight: "700", color: paleta.teal },
  hora: { fontSize: 15, fontWeight: "800", color: paleta.navy, marginTop: 2 },
  filaCentro: { flex: 1 },
  paciente: { fontSize: 15, fontWeight: "700", color: paleta.navy },
  esp: { fontSize: 12, color: paleta.teal, marginTop: 2 },
  vacio: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  vacioTit: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    marginTop: 16,
  },
  vacioSub: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginTop: 8,
  },
});
