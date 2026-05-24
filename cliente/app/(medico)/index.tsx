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
  fetchNotificacionesNoLeidasMedico,
  nombrePaciente,
  type CitaMedicoDto,
} from "../../lib/medicoApi";
import { badgeEstadoCitaMedico } from "../../lib/estadoCitaMedico";

export default function MedicoInicio(): React.JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.accessToken);
  const [citas, setCitas] = useState<CitaMedicoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifNoLeidas, setNotifNoLeidas] = useState(0);

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
      const [data, noLeidas] = await Promise.all([
        fetchCitasPendientesMedico(token),
        fetchNotificacionesNoLeidasMedico(token),
      ]);
      setCitas(Array.isArray(data) ? data : []);
      setNotifNoLeidas(typeof noLeidas === "number" ? noLeidas : 0);
    } catch {
      setCitas([]);
      setNotifNoLeidas(0);
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
          onNotificaciones={() => router.push("/(medico)/notificaciones")}
          notificacionesNoLeidas={notifNoLeidas}
        />

        <Text style={estilos.sec}>PRÓXIMA CITA</Text>
        {proxima ? (
          <TarjetaProximaCita cita={proxima} />
        ) : (
          <View style={estilos.cardVacio}>
            <Ionicons name="calendar-outline" size={32} color={paleta.skyblue} />
            <Text style={estilos.cardVacioTxt}>
              Sin citas pendientes por atender.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={estilos.btnAccion}
          onPress={() => router.push("/(medico)/historial")}
        >
          <Ionicons name="archive-outline" size={22} color={paleta.white} />
          <Text style={estilos.btnAccionTxt}>HISTORIAL DE CITAS</Text>
        </TouchableOpacity>

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

function TarjetaProximaCita({
  cita,
}: {
  cita: CitaMedicoDto;
}): React.JSX.Element {
  const ini = new Date(cita.inicio);
  const badge = badgeEstadoCitaMedico(cita.estado);
  const esp = cita.medico?.especialidad?.nombre ?? "Consulta médica";
  const monto = Math.round(parseFloat(cita.montoTotal));

  return (
    <TouchableOpacity
      style={estilos.cardCita}
      onPress={() =>
        router.push({
          pathname: "/(medico)/citas/[id]",
          params: { id: String(cita.citaID) },
        })
      }
      accessibilityRole="button"
    >
      <View style={estilos.fechaFranja}>
        <Text style={estilos.fechaSem}>
          {ini.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "")}
        </Text>
        <Text style={estilos.fechaNum}>
          {ini.toLocaleDateString("es-MX", { day: "numeric" })}
        </Text>
        <Text style={estilos.fechaMes}>
          {ini.toLocaleDateString("es-MX", { month: "short" }).replace(".", "")}
        </Text>
      </View>

      <View style={estilos.cardCitaBody}>
        <View style={estilos.cardCitaTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.cardCitaNombre} numberOfLines={1}>
              {nombrePaciente(cita.paciente)}
            </Text>
            <Text style={estilos.cardCitaSub} numberOfLines={1}>
              {esp}
            </Text>
          </View>
          <View style={[estilos.badge, { backgroundColor: badge.fondo }]}>
            <Ionicons name={badge.icono} size={11} color={badge.color} />
            <Text style={[estilos.badgeTxt, { color: badge.color }]}>
              {badge.etiqueta}
            </Text>
          </View>
        </View>

        <Text style={estilos.montoLabel}>TOTAL CONSULTA</Text>
        <Text style={estilos.monto}>${monto} MXN</Text>

        <View style={estilos.detallesFila}>
          <View style={estilos.detalleItem}>
            <Ionicons name="time-outline" size={14} color={paleta.teal} />
            <Text style={estilos.detalleTxt}>
              {ini.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={estilos.detalleItem}>
            <Ionicons name="location-outline" size={14} color={paleta.teal} />
            <Text style={estilos.detalleTxt} numberOfLines={1}>
              {cita.sucursal?.nombre ?? "—"}
            </Text>
          </View>
        </View>

        {cita.sucursal?.direccion ? (
          <Text style={estilos.direccion} numberOfLines={2}>
            {cita.sucursal.direccion}
          </Text>
        ) : null}

        <View style={estilos.verDetalle}>
          <Text style={estilos.verDetalleTxt}>Ver detalle</Text>
          <Ionicons name="arrow-forward" size={14} color={paleta.navy} />
        </View>
      </View>
    </TouchableOpacity>
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
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: paleta.navy,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  fechaFranja: {
    backgroundColor: paleta.navy,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
  },
  fechaSem: {
    fontSize: 11,
    fontWeight: "700",
    color: paleta.skyblue,
    textTransform: "capitalize",
  },
  fechaNum: {
    fontSize: 22,
    fontWeight: "800",
    color: paleta.white,
    marginVertical: 2,
  },
  fechaMes: {
    fontSize: 11,
    fontWeight: "600",
    color: paleta.skyblue,
    textTransform: "capitalize",
  },
  cardCitaBody: { flex: 1, padding: 14 },
  cardCitaTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  cardCitaNombre: { fontSize: 16, fontWeight: "800", color: paleta.navy },
  cardCitaSub: { fontSize: 12, color: paleta.teal, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 130,
  },
  badgeTxt: { fontSize: 9, fontWeight: "700" },
  montoLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 0.5,
  },
  monto: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    marginBottom: 8,
  },
  detallesFila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },
  detalleItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detalleTxt: { fontSize: 12, color: paleta.teal, fontWeight: "600" },
  direccion: {
    fontSize: 11,
    color: paleta.teal,
    opacity: 0.85,
    marginTop: 4,
    marginBottom: 8,
  },
  verDetalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  verDetalleTxt: { fontSize: 12, fontWeight: "700", color: paleta.navy },
  cardVacio: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  cardVacioTxt: { color: paleta.teal, fontSize: 14, textAlign: "center" },
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
