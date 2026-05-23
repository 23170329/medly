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
import {
  fetchCitasPendientesMedico,
  nombrePaciente,
  type CitaMedicoDto,
} from "../../lib/medicoApi";

export default function MedicoInicio(): React.JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.accessToken);
  const [citas, setCitas] = useState<CitaMedicoDto[]>([]);
  const [loading, setLoading] = useState(true);

  const nombreCorto = usuario?.nombre?.split(" ")[0] ?? "Doctor";
  const inicial = (usuario?.nombre?.[0] ?? "D").toUpperCase();

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
      const data = await fetchCitasPendientesMedico(token);
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
        showsVerticalScrollIndicator={false}
      >
        <EncabezadoPaciente
          nombreCorto={nombreCorto}
          inicial={inicial}
          onPerfil={() => router.push("/(medico)/perfil")}
        />

        <Text style={estilos.sec}>PRÓXIMA CITA</Text>
        {proxima ? (
          <TouchableOpacity
            style={estilos.cardCita}
            onPress={() =>
              router.push({
                pathname: "/(medico)/citas/[id]",
                params: { id: String(proxima.citaID) },
              })
            }
          >
            <View style={estilos.cardCitaIcono}>
              <Ionicons name="medkit-outline" size={22} color={paleta.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.cardCitaNombre}>
                {nombrePaciente(proxima.paciente)}
              </Text>
              <Text style={estilos.cardCitaSub}>
                {proxima.medico?.especialidad?.nombre ?? "Consulta"} ·{" "}
                {new Date(proxima.inicio).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={paleta.teal} />
          </TouchableOpacity>
        ) : (
          <View style={estilos.cardVacio}>
            <Text style={estilos.cardVacioTxt}>Sin citas pendientes por atender.</Text>
          </View>
        )}

        <TouchableOpacity
          style={estilos.btnAccion}
          onPress={() => router.push("/(medico)/expedientes")}
        >
          <Ionicons name="folder-open-outline" size={22} color={paleta.white} />
          <Text style={estilos.btnAccionTxt}>EXPEDIENTES</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnAccion}
          onPress={() => router.push("/(medico)/bloqueos")}
        >
          <Ionicons name="calendar-outline" size={22} color={paleta.white} />
          <Text style={estilos.btnAccionTxt}>GESTIONAR AGENDA</Text>
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
  cardCita: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCitaIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCitaNombre: { fontSize: 16, fontWeight: "700", color: paleta.navy },
  cardCitaSub: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  cardVacio: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 20,
  },
  cardVacioTxt: { color: paleta.teal, fontSize: 14 },
  btnAccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    marginBottom: 12,
  },
  btnAccionTxt: {
    color: paleta.white,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
