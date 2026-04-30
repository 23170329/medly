import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";

type EstadoCita = "CONFIRMADA" | "PENDIENTE" | "CANCELADA" | "COMPLETADA";
type FiltroValor = EstadoCita | "TODAS";

interface Cita {
  readonly id: string;
  readonly medico: string;
  readonly especialidad: string;
  readonly fecha: string;
  readonly hora: string;
  readonly sucursal: string;
  readonly estado: EstadoCita;
  readonly monto: number;
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

// ─── Mock data ────────────────────────────────────────────────────────────────
const CITAS_MOCK: readonly Cita[] = [
  {
    id: "1",
    medico: "Dr. Carlos Mendoza",
    especialidad: "Medicina General",
    fecha: "Lun 14 jul 2025",
    hora: "10:30 AM",
    sucursal: "Sucursal Centro",
    estado: "CONFIRMADA",
    monto: 450,
  },
  {
    id: "2",
    medico: "Dra. María Rodríguez",
    especialidad: "Cardiología",
    fecha: "Mié 23 jul 2025",
    hora: "03:00 PM",
    sucursal: "Sucursal Norte",
    estado: "PENDIENTE",
    monto: 800,
  },
  {
    id: "3",
    medico: "Dr. Luis Torres",
    especialidad: "Dermatología",
    fecha: "Mar 8 jun 2025",
    hora: "09:00 AM",
    sucursal: "Sucursal Centro",
    estado: "COMPLETADA",
    monto: 600,
  },
  {
    id: "4",
    medico: "Dra. Ana Gutiérrez",
    especialidad: "Pediatría",
    fecha: "Jue 3 jun 2025",
    hora: "11:00 AM",
    sucursal: "Sucursal Sur",
    estado: "CANCELADA",
    monto: 500,
  },
] as const;

// ─── Subcomponentes ───────────────────────────────────────────────────────────
interface TarjetaCitaProps {
  readonly cita: Cita;
}

function TarjetaCita({ cita }: TarjetaCitaProps): React.JSX.Element {
  const cfg = CONFIG_ESTADO[cita.estado];

  const handleVerDetalle = (): void => {
    router.push(
      `/(privado)/citas/${cita.id}` as Parameters<typeof router.push>[0],
    );
  };

  return (
    <TouchableOpacity
      style={estilos.tarjeta}
      onPress={handleVerDetalle}
      accessibilityLabel={`Cita con ${cita.medico}, ${cita.fecha}`}
      accessibilityRole="button"
    >
      {/* */}
      <View style={[estilos.franja, { backgroundColor: cfg.color }]} />

      <View style={estilos.tarjetaBody}>
        {/* */}
        <View style={estilos.tarjetaHeader}>
          <View style={estilos.medicoIcono}>
            <Ionicons name="person-outline" size={20} color={paleta.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.medicoNombre}>{cita.medico}</Text>
            <Text style={estilos.medicoEsp}>{cita.especialidad}</Text>
          </View>
          <View style={[estilos.badge, { backgroundColor: cfg.fondo }]}>
            <Ionicons name={cfg.icono} size={11} color={cfg.color} />
            <Text style={[estilos.badgeTexto, { color: cfg.color }]}>
              {cfg.etiqueta}
            </Text>
          </View>
        </View>

        <View style={estilos.divider} />

        {/* */}
        <View style={estilos.detalles}>
          <View style={estilos.detalleItem}>
            <Ionicons name="calendar-outline" size={14} color={paleta.teal} />
            <Text style={estilos.detalleTexto}>{cita.fecha}</Text>
          </View>
          <View style={estilos.detalleItem}>
            <Ionicons name="time-outline" size={14} color={paleta.teal} />
            <Text style={estilos.detalleTexto}>{cita.hora}</Text>
          </View>
          <View style={estilos.detalleItem}>
            <Ionicons name="location-outline" size={14} color={paleta.teal} />
            <Text style={estilos.detalleTexto}>{cita.sucursal}</Text>
          </View>
        </View>

        {/* */}
        <View style={estilos.tarjetaPie}>
          <Text style={estilos.monto}>${cita.monto} MXN</Text>
          <View style={estilos.acciones}>
            {cita.estado === "CONFIRMADA" && (
              <TouchableOpacity
                style={estilos.btnCancelar}
                accessibilityLabel="Cancelar esta cita"
                accessibilityRole="button"
              >
                <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={estilos.btnDetalle}
              onPress={handleVerDetalle}
              accessibilityLabel="Ver detalle completo"
              accessibilityRole="button"
            >
              <Text style={estilos.btnDetalleTexto}>Detalle</Text>
              <Ionicons name="arrow-forward" size={13} color={paleta.navy} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function AgendaPantalla(): React.JSX.Element {
  const [filtroActivo, setFiltroActivo] = useState<FiltroValor>("TODAS");

  const citasFiltradas = useCallback((): readonly Cita[] => {
    if (filtroActivo === "TODAS") return CITAS_MOCK;
    return CITAS_MOCK.filter((c) => c.estado === filtroActivo);
  }, [filtroActivo])();

  const conteo: Readonly<Record<string, number>> = {
    proximas: CITAS_MOCK.filter((c) => c.estado === "CONFIRMADA").length,
    pendientes: CITAS_MOCK.filter((c) => c.estado === "PENDIENTE").length,
    total: CITAS_MOCK.length,
  };

  return (
    <SafeAreaView style={estilos.areaSegura}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={estilos.header}>
        <Text style={estilos.headerTitulo}>MI AGENDA</Text>
        <TouchableOpacity
          style={estilos.btnNueva}
          onPress={() => router.push("/(privado)/citas/agendar/paso-1")}
          accessibilityLabel="Agendar nueva cita"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color={paleta.white} />
        </TouchableOpacity>
      </View>

      {/* ── Resumen ─────────────────────────────────────────── */}
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

      {/* ── Filtros ─────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.filtrosWrap}
        contentContainerStyle={estilos.filtrosContent}
      >
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
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Lista ───────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
      >
        {citasFiltradas.length === 0 ? (
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
              onPress={() => router.push("/(privado)/citas/agendar/paso-1")}
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

// ─── Estilos ──────────────────────────────────────────────────────────────────
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

  filtrosWrap: { maxHeight: 48, marginBottom: 8 },
  filtrosContent: { paddingHorizontal: 24, gap: 8, alignItems: "center" },
  filtroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: paleta.white,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  filtroBtnActivo: { backgroundColor: paleta.navy, borderColor: paleta.navy },
  filtroTexto: { fontSize: 13, fontWeight: "500", color: paleta.navy },
  filtroTextoActivo: { color: paleta.white, fontWeight: "700" },

  lista: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },

  tarjeta: {
    flexDirection: "row",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio + 4,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: paleta.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  franja: { width: 5 },
  tarjetaBody: { flex: 1, padding: 14 },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  medicoIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.skyblue,
    justifyContent: "center",
    alignItems: "center",
  },
  medicoNombre: { fontSize: 14, fontWeight: "700", color: paleta.navy },
  medicoEsp: { fontSize: 12, color: paleta.teal, marginTop: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTexto: { fontSize: 10, fontWeight: "600" },
  divider: {
    height: 1,
    backgroundColor: paleta.skyblue,
    opacity: 0.5,
    marginBottom: 10,
  },

  detalles: { gap: 5, marginBottom: 12 },
  detalleItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  detalleTexto: { fontSize: 13, color: paleta.navy, opacity: 0.75 },

  tarjetaPie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monto: { fontSize: 15, fontWeight: "700", color: paleta.navy },
  acciones: { flexDirection: "row", gap: 8 },
  btnCancelar: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.red,
  },
  btnCancelarTexto: { fontSize: 12, fontWeight: "600", color: paleta.red },
  btnDetalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.navy,
  },
  btnDetalleTexto: { fontSize: 12, fontWeight: "600", color: paleta.navy },

  // Vacío
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
