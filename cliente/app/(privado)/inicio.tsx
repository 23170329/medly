import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import {
  fetchEspecialidades,
  fetchProximaCita,
  type EspecialidadDto,
  type CitaDto,
} from "../../lib/medlyApi";

interface AccesoRapido {
  readonly id: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly label: string;
  readonly ruta: string;
}

const ACCESOS: readonly AccesoRapido[] = [
  {
    id: "1",
    icono: "calendar-outline",
    label: "Agendar",
    ruta: "/(privado)/citas/agendar",
  },
  {
    id: "2",
    icono: "list-outline",
    label: "Mis citas",
    ruta: "/(privado)/agenda",
  },
  {
    id: "3",
    icono: "business-outline",
    label: "Sucursales",
    ruta: "/(privado)/sucursales",
  },
  {
    id: "4",
    icono: "person-outline",
    label: "Perfil",
    ruta: "/(privado)/perfil/",
  },
] as const;

function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

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

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [esp, px] = await Promise.all([
        fetchEspecialidades().catch(() => []),
        fetchProximaCita().catch(() => null),
      ]);
      setEspecialidades(esp.slice(0, 6));
      setProxima(px);
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

  const nombreUsuario = usuario?.nombre || "Paciente";
  const inicialNombre = (usuario?.nombre?.charAt(0) ?? "P").toUpperCase();

  const handleAcceso = (ruta: string): void => {
    router.push(ruta as Parameters<typeof router.push>[0]);
  };

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
        <View style={estilos.encabezado}>
          <View>
            <Text style={estilos.saludo}>{obtenerSaludo()},</Text>
            <Text style={estilos.nombre}>{nombreUsuario}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(privado)/perfil/")}
            accessibilityLabel="Ir a mi perfil"
            accessibilityRole="button"
          >
            <View style={estilos.avatar}>
              <Text style={estilos.avatarLetra}>{inicialNombre}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={estilos.banner}>
          <View style={estilos.bannerIzq}>
            <Text style={estilos.bannerLabel}>PRÓXIMA CITA</Text>
            {cargando ? (
              <ActivityIndicator color={paleta.white} />
            ) : (
              <>
                <Text style={estilos.bannerMedico}>{bannerMedico}</Text>
                <Text style={estilos.bannerEsp}>{bannerEsp}</Text>
                {ini && (
                  <>
                    <View style={estilos.bannerFila}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={paleta.white}
                      />
                      <Text style={estilos.bannerDato}>
                        {ini.toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    <View style={estilos.bannerFila}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={paleta.white}
                      />
                      <Text style={estilos.bannerDato}>
                        {ini.toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
          <TouchableOpacity
            style={estilos.bannerBtn}
            onPress={() => router.push("/(privado)/agenda")}
            accessibilityLabel="Ver agenda"
            accessibilityRole="button"
          >
            <Text style={estilos.bannerBtnTexto}>Ver</Text>
            <Ionicons name="arrow-forward" size={14} color={paleta.navy} />
          </TouchableOpacity>
        </View>

        <Text style={estilos.seccionTitulo}>ACCESOS RÁPIDOS</Text>
        <View style={estilos.accesosFila}>
          {ACCESOS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={estilos.accesoItem}
              onPress={() => handleAcceso(item.ruta)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              <View style={estilos.accesoIcono}>
                <Ionicons name={item.icono} size={26} color={paleta.navy} />
              </View>
              <Text style={estilos.accesoLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilos.seccionHeader}>
          <Text style={estilos.seccionTitulo}>ESPECIALIDADES</Text>
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

  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  saludo: { fontSize: 14, color: paleta.teal },
  nombre: { fontSize: 22, fontWeight: "700", color: paleta.navy, marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: paleta.navy,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetra: { fontSize: 20, fontWeight: "700", color: paleta.white },

  banner: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio + 4,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bannerIzq: { flex: 1 },
  bannerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: paleta.skyblue,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  bannerMedico: {
    fontSize: 17,
    fontWeight: "700",
    color: paleta.white,
    marginBottom: 2,
  },
  bannerEsp: { fontSize: 13, color: paleta.skyblue, marginBottom: 10 },
  bannerFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  bannerDato: { fontSize: 13, color: paleta.white, marginLeft: 4 },
  bannerBtn: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bannerBtnTexto: { fontSize: 13, fontWeight: "600", color: paleta.navy },

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
  verTodos: { fontSize: 12, color: paleta.teal, fontWeight: "600" },

  accesosFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  accesoItem: { alignItems: "center", flex: 1 },
  accesoIcono: {
    width: 58,
    height: 58,
    borderRadius: BORDES.radio + 4,
    backgroundColor: paleta.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  accesoLabel: {
    fontSize: 11,
    fontWeight: "600",
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
