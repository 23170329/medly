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
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import {
  fetchMisCitas,
  type CitaDto,
  type EstadoCitaApi,
} from "../../lib/medlyApi";

type EstadoCita =
  | "CONFIRMADA"
  | "PENDIENTE"
  | "ANTICIPO"
  | "CANCELADA"
  | "COMPLETADA";

type FiltroValor = EstadoCita | "TODAS";

function mapEstadoApi(a: EstadoCitaApi): EstadoCita {
  if (a === "PENDIENTE_PAGO") return "PENDIENTE";
  if (a === "ANTICIPO_REALIZADO") return "ANTICIPO";
  if (a === "CONFIRMADA") return "CONFIRMADA";
  if (a === "CANCELADA") return "CANCELADA";
  return "COMPLETADA";
}

interface CitaUi {
  readonly id: string;
  readonly medico: string;
  readonly especialidad: string;
  readonly fecha: string;
  readonly hora: string;
  readonly diaSemanaCorta: string;
  readonly diaNumero: string;
  readonly mesCorto: string;
  readonly sucursal: string;
  readonly estado: EstadoCita;
  readonly monto: number;
  readonly anticipoPagado: boolean;
  readonly raw: CitaDto;
}

interface ConfigEstado {
  readonly color: string;
  readonly fondo: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly etiqueta: string;
}

interface Filtro {
  readonly label: string;
  readonly valor: FiltroValor;
}

const CONFIG_ESTADO: Readonly<Record<EstadoCita, ConfigEstado>> = {
  CONFIRMADA: {
    color: paleta.green,
    fondo: "#DCF0E4",
    icono: "checkmark-circle-outline",
    etiqueta: "Confirmada",
  },
  PENDIENTE: {
    color: "#D97706",
    fondo: "#FEF3C7",
    icono: "time-outline",
    etiqueta: "Pendiente",
  },
  ANTICIPO: {
    color: paleta.green,
    fondo: "#DCF0E4",
    icono: "cash-outline",
    etiqueta: "Anticipo realizado",
  },
  COMPLETADA: {
    color: paleta.teal,
    fondo: "#DCE8F0",
    icono: "ribbon-outline",
    etiqueta: "Completada",
  },
  CANCELADA: {
    color: paleta.red,
    fondo: "#FDE8E8",
    icono: "close-circle-outline",
    etiqueta: "Cancelada",
  },
} as const;

const FILTROS: readonly Filtro[] = [
  { label: "Todas", valor: "TODAS" },
  { label: "Próximas", valor: "CONFIRMADA" },
  { label: "Pendientes", valor: "PENDIENTE" },
  { label: "Completadas", valor: "COMPLETADA" },
  { label: "Canceladas", valor: "CANCELADA" },
] as const;

function toUi(d: CitaDto): CitaUi {
  const ini = new Date(d.inicio);
  const med = d.medico
    ? `${d.medico.nombre} ${d.medico.apellidoPat}`
    : "Médico";
  const esp = d.medico?.especialidad?.nombre ?? "—";
  const diaSemanaCorta = ini
    .toLocaleDateString("es-MX", { weekday: "short" })
    .replace(".", "");
  const diaNumero = ini.toLocaleDateString("es-MX", { day: "numeric" });
  const mesCorto = ini
    .toLocaleDateString("es-MX", { month: "short" })
    .replace(".", "");
  return {
    id: String(d.citaID),
    medico: med,
    especialidad: esp,
    fecha: ini.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    hora: ini.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    diaSemanaCorta,
    diaNumero,
    mesCorto,
    sucursal: d.sucursal?.nombre ?? "—",
    estado: mapEstadoApi(d.estado),
    monto: Math.round(parseFloat(d.montoTotal)),
    anticipoPagado:
      d.estado === "ANTICIPO_REALIZADO" ||
      (d.estado === "CONFIRMADA" &&
        (d.pagos ?? []).some(
          (p) => p.tipo === "ANTICIPO_50" && p.estado === "COMPLETADO",
        )),
    raw: d,
  };
}

interface TarjetaCitaProps {
  readonly cita: CitaUi;
}

function TarjetaCita({ cita }: TarjetaCitaProps): React.JSX.Element {
  const cfg = CONFIG_ESTADO[cita.estado];

  const handleVerDetalle = (): void => {
    if (cita.estado === "COMPLETADA") {
      router.push({
        pathname: "/(privado)/historial/[id]",
        params: { id: String(cita.citaID) },
      });
      return;
    }
    router.push(`/(privado)/citas/${cita.id}`);
  };

  return (
    <View style={estilos.tarjeta} accessibilityLabel={`Cita con ${cita.medico}`}>
      <View style={estilos.cajaFecha}>
        <Text style={estilos.cajaFechaSem}>{cita.diaSemanaCorta}</Text>
        <Text style={estilos.cajaFechaNum}>{cita.diaNumero}</Text>
        <Text style={estilos.cajaFechaMes}>{cita.mesCorto}</Text>
      </View>

      <View style={estilos.tarjetaBody}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleVerDetalle}
          accessibilityLabel={`Cita con ${cita.medico}, ${cita.fecha}`}
          accessibilityRole="button"
        >
          <View style={estilos.tarjetaHeader}>
            <View style={estilos.medicoIcono}>
              <Ionicons name="person-outline" size={16} color={paleta.navy} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.medicoNombre} numberOfLines={1}>
                {cita.medico}
              </Text>
              <Text style={estilos.medicoEsp} numberOfLines={1}>
                {cita.especialidad}
              </Text>
            </View>
            <View style={[estilos.badge, { backgroundColor: cfg.fondo }]}>
              <Ionicons name={cfg.icono} size={10} color={cfg.color} />
              <Text style={[estilos.badgeTexto, { color: cfg.color }]}>
                {cfg.etiqueta}
              </Text>
            </View>
          </View>

          {cita.anticipoPagado && cita.estado !== "ANTICIPO" && (
            <View
              style={[
                estilos.badge,
                {
                  backgroundColor: "#DCF0E4",
                  alignSelf: "flex-start",
                  marginBottom: 6,
                },
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={10}
                color={paleta.green}
              />
              <Text style={[estilos.badgeTexto, { color: paleta.green }]}>
                Anticipo realizado
              </Text>
            </View>
          )}

          <View style={estilos.precioBloque}>
            <Text style={estilos.precioEtiqueta}>Total consulta</Text>
            <Text style={estilos.monto}>${cita.monto} MXN</Text>
          </View>
        </TouchableOpacity>

        <View style={estilos.tarjetaPie}>
          <View style={estilos.detalleItem}>
            <Ionicons name="time-outline" size={13} color={paleta.teal} />
            <Text style={estilos.detalleTexto} numberOfLines={1}>
              {cita.hora}
            </Text>
          </View>
          <View style={[estilos.detalleItem, estilos.detalleItemSucursal]}>
            <Ionicons name="location-outline" size={13} color={paleta.teal} />
            <Text style={estilos.detalleTexto} numberOfLines={1}>
              {cita.sucursal}
            </Text>
          </View>
          <TouchableOpacity
            style={estilos.btnDetalle}
            onPress={handleVerDetalle}
            accessibilityLabel="Ver detalle completo"
            accessibilityRole="button"
          >
            <Text style={estilos.btnDetalleTexto}>Detalle</Text>
            <Ionicons name="arrow-forward" size={12} color={paleta.navy} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AgendaPantalla(): React.JSX.Element {
  const [filtroActivo, setFiltroActivo] = useState<FiltroValor>("TODAS");
  const [citas, setCitas] = useState<CitaUi[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchMisCitas();
      setCitas(data.map(toUi));
    } catch {
      setCitas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const citasFiltradas = citas.filter((c) => {
    if (filtroActivo === "TODAS") return true;
    if (filtroActivo === "CONFIRMADA") {
      return c.estado === "CONFIRMADA" || c.estado === "ANTICIPO";
    }
    return c.estado === filtroActivo;
  });

  const conteo = {
    proximas: citas.filter(
      (c) => c.estado === "CONFIRMADA" || c.estado === "ANTICIPO",
    ).length,
    pendientes: citas.filter((c) => c.estado === "PENDIENTE").length,
    total: citas.length,
  };

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <View style={estilos.header}>
        <Text style={estilos.headerTitulo}>MI AGENDA</Text>
        <TouchableOpacity
          style={estilos.btnNueva}
          onPress={() => router.push("/(privado)/citas/agendar")}
          accessibilityLabel="Agendar nueva cita"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color={paleta.white} />
        </TouchableOpacity>
      </View>

      <View style={estilos.resumenFila}>
        {[
          {
            num: conteo.proximas,
            label: "Próximas",
            fondo: "#DCF0E4",
            color: paleta.green,
          },
          {
            num: conteo.pendientes,
            label: "Pendientes",
            fondo: "#FEF3C7",
            color: "#D97706",
          },
          {
            num: conteo.total,
            label: "Total",
            fondo: paleta.skyblue,
            color: paleta.navy,
          },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[estilos.statCard, { backgroundColor: stat.fondo }]}
          >
            <Text style={[estilos.statNum, { color: stat.color }]}>
              {stat.num}
            </Text>
            <Text style={estilos.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={estilos.filtrosFila}>
        {FILTROS.map((f) => {
          const activo = filtroActivo === f.valor;
          return (
            <TouchableOpacity
              key={f.valor}
              style={[estilos.filtroBtn, activo && estilos.filtroBtnActivo]}
              onPress={() => setFiltroActivo(f.valor)}
              accessibilityLabel={`Filtrar por ${f.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
            >
              <Text
                style={[
                  estilos.filtroTexto,
                  activo && estilos.filtroTextoActivo,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
        }
      >
        {cargando && citas.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={paleta.navy} />
        ) : citasFiltradas.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons
              name="calendar-outline"
              size={56}
              color={paleta.skyblue}
            />
            <Text style={estilos.vacioTitulo}>Sin citas</Text>
            <Text style={estilos.vacioSub}>
              No tienes citas en esta categoría
            </Text>
            <TouchableOpacity
              style={estilos.vacioBtn}
              onPress={() => router.push("/(privado)/citas/agendar")}
            >
              <Text style={estilos.vacioBtnTexto}>Agendar ahora</Text>
            </TouchableOpacity>
          </View>
        ) : (
          citasFiltradas.map((cita) => (
            <TarjetaCita key={cita.id} cita={cita} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: COLORES.fondo },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 1,
  },
  btnNueva: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: paleta.navy,
    justifyContent: "center",
    alignItems: "center",
  },

  resumenFila: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: BORDES.radio,
    padding: 12,
    alignItems: "center",
  },
  statNum: { fontSize: 22, fontWeight: "700" },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: paleta.navy,
    opacity: 0.7,
    marginTop: 2,
  },

  filtrosFila: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  filtroBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: paleta.white,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  filtroBtnActivo: { backgroundColor: paleta.navy, borderColor: paleta.navy },
  filtroTexto: {
    fontSize: 11,
    fontWeight: "500",
    color: paleta.navy,
    textAlign: "center",
  },
  filtroTextoActivo: { color: paleta.white, fontWeight: "700" },

  lista: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },

  tarjeta: {
    flexDirection: "row",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 1,
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cajaFecha: {
    width: 48,
    backgroundColor: paleta.headerBar,
    paddingVertical: 8,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  cajaFechaSem: {
    fontSize: 8,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    textTransform: "capitalize",
  },
  cajaFechaNum: {
    fontSize: 17,
    fontWeight: "800",
    color: paleta.white,
    lineHeight: 20,
    marginVertical: 1,
  },
  cajaFechaMes: {
    fontSize: 8,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    textTransform: "capitalize",
  },
  tarjetaBody: { flex: 1, padding: 10, minWidth: 0 },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  medicoIcono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: paleta.skyblue,
    justifyContent: "center",
    alignItems: "center",
  },
  medicoNombre: { fontSize: 13, fontWeight: "700", color: paleta.navy },
  medicoEsp: { fontSize: 11, color: paleta.teal, marginTop: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTexto: { fontSize: 9, fontWeight: "600" },

  precioBloque: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 2,
  },
  precioEtiqueta: {
    fontSize: 10,
    fontWeight: "600",
    color: paleta.teal,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  monto: { fontSize: 14, fontWeight: "800", color: paleta.navy },

  tarjetaPie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  detalleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  detalleItemSucursal: { flex: 1, minWidth: 0 },
  detalleTexto: { fontSize: 11, color: paleta.navy, opacity: 0.85 },
  btnDetalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.navy,
  },
  btnDetalleTexto: { fontSize: 11, fontWeight: "600", color: paleta.navy },

  vacio: { alignItems: "center", paddingTop: 60 },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 16,
    marginBottom: 6,
  },
  vacioSub: { fontSize: 14, color: paleta.teal, textAlign: "center" },
  vacioBtn: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio,
  },
  vacioBtnTexto: { fontSize: 14, fontWeight: "700", color: paleta.white },
});
