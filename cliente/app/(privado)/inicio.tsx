import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import { EncabezadoPaciente } from "../../componentes/layout/EncabezadoPaciente";
import {
  fetchEspecialidades,
  fetchNotificacionesNoLeidas,
  fetchProximaCita,
  type EspecialidadDto,
  type CitaDto,
} from "../../lib/medlyApi";

interface AccesoRapido {
  readonly id: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly label: string;
  readonly onPress: () => void;
}

const ACCESOS: readonly AccesoRapido[] = [
  {
    id: "1",
    icono: "calendar-outline",
    label: "Agendar cita",
    onPress: () => router.push("/(privado)/citas/agendar"),
  },
  {
    id: "2",
    icono: "business-outline",
    label: "Sucursales",
    onPress: () => router.push("/(privado)/sucursales"),
  },
  {
    id: "3",
    icono: "pulse-outline",
    label: "Diagnóstico",
    onPress: () =>
      Alert.alert("Diagnóstico", "Próximamente enlazaremos resultados y notas."),
  },
  {
    id: "4",
    icono: "flask-outline",
    label: "Laboratorio",
    onPress: () =>
      Alert.alert("Laboratorio", "Próximamente verás estudios y resultados."),
  },
] as const;

function iconoEsp(icono: string | null): React.ComponentProps<typeof Ionicons>["name"] {
  const mapa: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
    "medkit-outline": "medkit-outline",
    "heart-outline": "heart-outline",
    "happy-outline": "happy-outline",
    "sunny-outline": "sunny-outline",
    "pulse-outline": "pulse-outline",
    "eye-outline": "eye-outline",
    "female-outline": "female-outline",
    "git-network-outline": "git-network-outline",
  };
  return mapa[icono ?? ""] ?? "medkit-outline";
}

export default function InicioPantalla(): React.JSX.Element {
  const { usuario } = useAuthStore();
  const [especialidades, setEspecialidades] = useState<EspecialidadDto[]>([]);
  const [proxima, setProxima] = useState<CitaDto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [notifNoLeidas, setNotifNoLeidas] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [esp, px, notifCount] = await Promise.all([
        fetchEspecialidades().catch(() => []),
        fetchProximaCita().catch(() => null),
        fetchNotificacionesNoLeidas().catch(() => 0),
      ]);
      setEspecialidades(esp.slice(0, 6));
      setProxima(px);
      setNotifNoLeidas(notifCount);
    } catch {
      setEspecialidades([]);
      setProxima(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const nombreMostrar =
    `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim() || "Paciente";
  const inicialNombre = (usuario?.nombre?.charAt(0) ?? "P").toUpperCase();

  const bannerMedico = proxima?.medico
    ? `${proxima.medico.nombre} ${proxima.medico.apellidoPat}`
    : "Sin cita próxima";
  const bannerEsp =
    proxima?.medico?.especialidad?.nombre ?? "Agenda tu próxima visita";
  const ini = proxima ? new Date(proxima.inicio) : null;

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        <EncabezadoPaciente
          nombreCorto={nombreMostrar}
          inicial={inicialNombre}
          onPerfil={() => router.push("/(privado)/perfil/")}
          onNotificaciones={() =>
            router.push("/(privado)/notificaciones")
          }
          notificacionesNoLeidas={notifNoLeidas}
        />

        <View style={estilos.tarjetaProxima}>
          <View style={estilos.tarjetaProximaHeader}>
            <Text style={estilos.bannerLabel}>PRÓXIMA CITA</Text>
            <TouchableOpacity
              onPress={() => router.push("/(privado)/agenda")}
              style={estilos.verLink}
              accessibilityRole="button"
            >
              <Text style={estilos.verLinkTxt}>Ver agenda</Text>
              <Ionicons name="arrow-forward" size={14} color={paleta.teal} />
            </TouchableOpacity>
          </View>
          {cargando ? (
            <ActivityIndicator color={paleta.navy} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <Text style={estilos.bannerMedico}>{bannerMedico}</Text>
              <Text style={estilos.bannerEsp}>{bannerEsp}</Text>
              {ini && (
                <View style={estilos.bannerFilas}>
                  <View style={estilos.bannerFila}>
                    <Ionicons name="calendar-outline" size={16} color={paleta.teal} />
                    <Text style={estilos.bannerDato}>
                      {ini.toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <View style={estilos.bannerFila}>
                    <Ionicons name="time-outline" size={16} color={paleta.teal} />
                    <Text style={estilos.bannerDato}>
                      {ini.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        <Text style={estilos.seccionTitulo}>ACCESOS RÁPIDOS</Text>
        <View style={estilos.gridAccesos}>
          {ACCESOS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={estilos.accesoCard}
              onPress={item.onPress}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              <View style={estilos.accesoIcono}>
                <Ionicons name={item.icono} size={28} color={paleta.navy} />
              </View>
              <Text style={estilos.accesoLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilos.seccionHeader}>
          <Text style={[estilos.seccionTitulo, estilos.seccionTituloEnFila]}>
            ESPECIALIDADES
          </Text>
          <TouchableOpacity onPress={() => router.push("/(privado)/citas/agendar")}>
            <Text style={estilos.verTodos}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.grid}>
          {especialidades.map((esp, idx) => {
            const fondos = ["#DCE8F0", "#F0DCE0", "#DCF0E4", "#F0EDDC", "#E4DCF0", "#DCF0EE"];
            return (
              <TouchableOpacity
                key={esp.especialidadID}
                style={[estilos.espCard, { backgroundColor: fondos[idx % fondos.length] }]}
                onPress={() => router.push("/(privado)/citas/agendar")}
                accessibilityLabel={`Agendar cita de ${esp.nombre}`}
                accessibilityRole="button"
              >
                <Ionicons
                  name={iconoEsp(esp.icono)}
                  size={28}
                  color={paleta.navy}
                />
                <Text style={estilos.espNombre}>{esp.nombre}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={estilos.btnAgendar}
          onPress={() => router.push("/(privado)/citas/agendar")}
          accessibilityLabel="Agendar nueva cita médica"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={22} color={paleta.white} />
          <Text style={estilos.btnAgendarTexto}>AGENDAR NUEVA CITA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },

  tarjetaProxima: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio + 4,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
    shadowColor: paleta.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tarjetaProximaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  verLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  verLinkTxt: { fontSize: 13, fontWeight: "600", color: paleta.teal },
  bannerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 1.4,
  },
  bannerMedico: {
    fontSize: 17,
    fontWeight: "700",
    color: paleta.navy,
    marginBottom: 4,
  },
  bannerEsp: {
    fontSize: 13,
    color: paleta.navy,
    opacity: 0.72,
    marginBottom: 12,
  },
  bannerFilas: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  bannerFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerDato: { fontSize: 14, color: paleta.navy, fontWeight: "500" },

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  seccionTituloEnFila: { marginBottom: 0 },
  verTodos: { fontSize: 12, color: paleta.teal, fontWeight: "600" },

  gridAccesos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 28,
    justifyContent: "space-between",
  },
  accesoCard: {
    width: "47%",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio + 2,
    paddingVertical: 22,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,56,79,0.08)",
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accesoIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORES.fondo,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  accesoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: paleta.navy,
    textAlign: "center",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  espCard: {
    width: "47%",
    borderRadius: BORDES.radio,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  espNombre: {
    fontSize: 12,
    fontWeight: "600",
    color: paleta.navy,
    textAlign: "center",
  },

  btnAgendar: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnAgendarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: paleta.white,
    letterSpacing: 0.5,
  },
});
