import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import {
  fetchNotificaciones,
  marcarNotificacionLeida,
  eliminarNotificacion,
  type NotificacionDto,
} from "../../../lib/medlyApi";

function motivoCancelacionMedico(n: NotificacionDto): string | null {
  const desdeApi = n.motivoCancelacion?.trim();
  if (desdeApi) return desdeApi;
  if (
    n.tipo !== "CITA_CANCELADA" ||
    !/médico/i.test(n.titulo ?? "")
  ) {
    return null;
  }
  const match = n.mensaje.match(/Motivo:\s*([\s\S]+?)(?:\.\s*(?:El anticipo|Toca Reagendar|Puedes reagendar)|$)/i);
  return match?.[1]?.trim() || null;
}

function esCancelacionPorMedico(n: NotificacionDto): boolean {
  return (
    n.tipo === "CITA_CANCELADA" &&
    (n.canceladaPorMedico === true || /médico/i.test(n.titulo ?? ""))
  );
}

export default function NotificacionesPantalla(): React.JSX.Element {
  const [lista, setLista] = useState<NotificacionDto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchNotificaciones();
      setLista(data);
    } catch {
      setLista([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const handleMarcarLeida = async (id: number): Promise<void> => {
    try {
      await marcarNotificacionLeida(id);
      setLista((prev) =>
        prev.map((n) =>
          n.notificacionID === id ? { ...n, leida: true } : n,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  const handleCalificar = async (n: NotificacionDto): Promise<void> => {
    if (!n.citaID) return;
    try {
      await marcarNotificacionLeida(n.notificacionID);
      setLista((prev) =>
        prev.map((x) =>
          x.notificacionID === n.notificacionID ? { ...x, leida: true } : x,
        ),
      );
    } catch {
      /* ignore */
    }
    router.push({
      pathname: "/(privado)/calificar/[citaId]",
      params: {
        citaId: String(n.citaID),
        notificacionId: String(n.notificacionID),
      },
    });
  };

  const handleReagendar = async (n: NotificacionDto): Promise<void> => {
    try {
      await eliminarNotificacion(n.notificacionID);
      setLista((prev) =>
        prev.filter((x) => x.notificacionID !== n.notificacionID),
      );
    } catch {
      void handleMarcarLeida(n.notificacionID);
    }
    if (n.medicoID) {
      router.push({
        pathname: "/(privado)/citas/agendar",
        params: {
          reagendar: "1",
          medicoId: String(n.medicoID),
          sucursalId: n.sucursalID ? String(n.sucursalID) : "",
        },
      });
      return;
    }
    router.push("/(privado)/citas/agendar");
  };

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>NOTIFICACIONES</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
        }
      >
        {cargando && lista.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={paleta.navy} />
        ) : lista.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons
              name="notifications-off-outline"
              size={56}
              color={paleta.skyblue}
            />
            <Text style={estilos.vacioTitulo}>Sin notificaciones</Text>
            <Text style={estilos.vacioSub}>
              No tienes notificaciones pendientes
            </Text>
          </View>
        ) : (
          lista.map((n) => (
            <View
              key={n.notificacionID}
              style={[estilos.card, !n.leida && estilos.cardNoLeida]}
            >
              <TouchableOpacity
                onPress={() => void handleMarcarLeida(n.notificacionID)}
                accessibilityRole="button"
              >
                <View style={estilos.cardHeader}>
                  <View
                    style={[
                      estilos.dot,
                      { backgroundColor: n.leida ? "transparent" : paleta.teal },
                    ]}
                  />
                  <Text
                    style={[
                      estilos.cardTitulo,
                      !n.leida && estilos.cardTituloNoLeida,
                    ]}
                  >
                    {n.titulo}
                  </Text>
                </View>
                <Text style={estilos.cardMensaje}>{n.mensaje}</Text>
                {esCancelacionPorMedico(n) ? (
                  <View style={estilos.motivoBloque}>
                    <Text style={estilos.motivoLbl}>
                      Motivo de cancelación del médico
                    </Text>
                    <Text style={estilos.motivoTxt}>
                      {motivoCancelacionMedico(n) ??
                        "No se registró el motivo de cancelación."}
                    </Text>
                  </View>
                ) : null}
                <Text style={estilos.cardFecha}>
                  {new Date(n.fechaCreacion).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
              {n.tipo === "CALIFICAR_MEDICO" && n.citaID != null ? (
                <TouchableOpacity
                  style={estilos.btnCalificar}
                  onPress={() => void handleCalificar(n)}
                  accessibilityRole="button"
                >
                  <Ionicons name="star" size={16} color={paleta.white} />
                  <Text style={estilos.btnCalificarTxt}>Calificar médico</Text>
                </TouchableOpacity>
              ) : null}
              {n.permiteReagendar && n.tipo === "CITA_CANCELADA" ? (
                <TouchableOpacity
                  style={estilos.btnReagendar}
                  onPress={() => void handleReagendar(n)}
                  accessibilityRole="button"
                >
                  <Ionicons name="calendar-outline" size={16} color={paleta.white} />
                  <Text style={estilos.btnReagendarTxt}>Reagendar cita</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 1,
  },
  scroll: { padding: 24, paddingBottom: 48 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  cardNoLeida: {
    borderLeftColor: paleta.teal,
    backgroundColor: "#F0F7FA",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: paleta.navy,
  },
  cardTituloNoLeida: {
    fontWeight: "800",
  },
  cardMensaje: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginBottom: 8,
  },
  motivoBloque: {
    backgroundColor: "#F0F7FA",
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: paleta.red,
  },
  motivoLbl: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  motivoTxt: {
    fontSize: 13,
    color: paleta.navy,
    lineHeight: 19,
    fontWeight: "600",
  },
  cardFecha: {
    fontSize: 11,
    color: paleta.teal,
    fontWeight: "500",
  },
  btnCalificar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnCalificarTxt: {
    color: paleta.white,
    fontWeight: "700",
    fontSize: 13,
  },
  btnReagendar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: paleta.teal,
    borderRadius: BORDES.radio,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnReagendarTxt: {
    color: paleta.white,
    fontWeight: "700",
    fontSize: 13,
  },
  vacio: { alignItems: "center", paddingTop: 60 },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 16,
  },
  vacioSub: {
    fontSize: 14,
    color: paleta.teal,
    marginTop: 6,
  },
});
