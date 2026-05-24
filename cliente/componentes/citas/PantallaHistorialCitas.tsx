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
import { COLORES, paleta, BORDES } from "../../constants/theme";

export interface HistorialCitaItem {
  citaID: number;
  inicio: string;
  fin?: string;
  montoTotal?: string;
  estado?: string;
  medico?: {
    nombre: string;
    apellidoPat: string;
    apellidoMat?: string | null;
    especialidad?: { nombre: string };
  };
  paciente?: {
    nombre: string;
    apellido_pat: string;
    apellido_mat?: string | null;
  };
  sucursal?: { nombre: string; direccion?: string };
}

interface Props {
  readonly titulo: string;
  readonly rol: "paciente" | "medico";
  readonly cargarLista: () => Promise<HistorialCitaItem[]>;
  readonly rutaDetalle: (id: number) => string;
}

function tituloPersona(item: HistorialCitaItem, rol: Props["rol"]): string {
  if (rol === "medico" && item.paciente) {
    const am = item.paciente.apellido_mat ? ` ${item.paciente.apellido_mat}` : "";
    return `${item.paciente.nombre} ${item.paciente.apellido_pat}${am}`.trim();
  }
  if (item.medico) {
    return `${item.medico.nombre} ${item.medico.apellidoPat}`.trim();
  }
  return rol === "medico" ? "Paciente" : "Médico";
}

export function PantallaHistorialCitas({
  titulo,
  rol,
  cargarLista,
  rutaDetalle,
}: Props): React.JSX.Element {
  const [lista, setLista] = useState<HistorialCitaItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await cargarLista();
      setLista(Array.isArray(data) ? data : []);
    } catch {
      setLista([]);
    } finally {
      setCargando(false);
    }
  }, [cargarLista]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>{titulo}</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
        }
      >
        {cargando && lista.length === 0 ? (
          <ActivityIndicator color={paleta.navy} style={{ marginTop: 40 }} />
        ) : lista.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons name="archive-outline" size={56} color={paleta.skyblue} />
            <Text style={estilos.vacioTitulo}>Sin citas completadas</Text>
            <Text style={estilos.vacioSub}>
              Las consultas finalizadas aparecerán aquí con todos sus detalles.
            </Text>
          </View>
        ) : (
          lista.map((item) => {
            const ini = new Date(item.inicio);
            const monto = item.montoTotal
              ? Math.round(parseFloat(item.montoTotal))
              : null;
            return (
              <TouchableOpacity
                key={item.citaID}
                style={estilos.card}
                onPress={() => router.push(rutaDetalle(item.citaID) as never)}
                accessibilityRole="button"
              >
                <View style={estilos.fechaFranja}>
                  <Text style={estilos.fechaSem}>
                    {ini.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "")}
                  </Text>
                  <Text style={estilos.fechaNum}>
                    {ini.toLocaleDateString("es-MX", { day: "numeric" })}
                  </Text>
                </View>
                <View style={estilos.cardBody}>
                  <Text style={estilos.nombre}>{tituloPersona(item, rol)}</Text>
                  <Text style={estilos.sub}>
                    {rol === "paciente"
                      ? (item.medico?.especialidad?.nombre ?? "Consulta")
                      : (item.sucursal?.nombre ?? "Sucursal")}
                  </Text>
                  <View style={estilos.fila}>
                    <Ionicons name="time-outline" size={14} color={paleta.teal} />
                    <Text style={estilos.dato}>
                      {ini.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {item.sucursal?.nombre ? (
                      <>
                        <Ionicons name="location-outline" size={14} color={paleta.teal} />
                        <Text style={estilos.dato} numberOfLines={1}>
                          {item.sucursal.nombre}
                        </Text>
                      </>
                    ) : null}
                  </View>
                  {monto != null ? (
                    <Text style={estilos.monto}>${monto} MXN</Text>
                  ) : null}
                  <View style={estilos.badge}>
                    <Ionicons name="ribbon-outline" size={12} color={paleta.teal} />
                    <Text style={estilos.badgeTxt}>Completada</Text>
                  </View>
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
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    marginBottom: 12,
    overflow: "hidden",
    paddingRight: 12,
  },
  fechaFranja: {
    backgroundColor: paleta.navy,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    minWidth: 52,
  },
  fechaSem: {
    fontSize: 10,
    fontWeight: "700",
    color: paleta.skyblue,
    textTransform: "capitalize",
  },
  fechaNum: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.white,
  },
  cardBody: { flex: 1, padding: 12 },
  nombre: { fontSize: 15, fontWeight: "800", color: paleta.navy },
  sub: { fontSize: 12, color: paleta.teal, marginTop: 2, marginBottom: 6 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  dato: { fontSize: 12, color: paleta.teal, fontWeight: "600", maxWidth: 120 },
  monto: { fontSize: 14, fontWeight: "800", color: paleta.navy, marginTop: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#DCE8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTxt: { fontSize: 10, fontWeight: "700", color: paleta.teal },
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
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
