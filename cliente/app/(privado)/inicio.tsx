import React from "react";
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

interface ProximaCita {
  readonly medico: string;
  readonly especialidad: string;
  readonly fecha: string;
  readonly hora: string;
}

interface AccesoRapido {
  readonly id: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly label: string;
  readonly ruta: string;
}

interface Especialidad {
  readonly id: string;
  readonly nombre: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly fondo: string;
}

// ─── Mock data (reemplazar) ──────────────────────────────────
const PROXIMA_CITA: ProximaCita = {
  medico: "Dr. Carlos Mendoza",
  especialidad: "Medicina General",
  fecha: "Lun 14 jul 2025",
  hora: "10:30 AM",
};

const ACCESOS: readonly AccesoRapido[] = [
  {
    id: "1",
    icono: "calendar-outline",
    label: "Agendar",
    ruta: "/(privado)/citas/agendar/paso-1",
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
    ruta: "/(privado)/sucursales/",
  },
  {
    id: "4",
    icono: "person-outline",
    label: "Perfil",
    ruta: "/(privado)/perfil/",
  },
] as const;

const ESPECIALIDADES: readonly Especialidad[] = [
  {
    id: "1",
    nombre: "Medicina General",
    icono: "medkit-outline",
    fondo: "#DCE8F0",
  },
  { id: "2", nombre: "Cardiología", icono: "heart-outline", fondo: "#F0DCE0" },
  { id: "3", nombre: "Pediatría", icono: "happy-outline", fondo: "#DCF0E4" },
  { id: "4", nombre: "Dermatología", icono: "sunny-outline", fondo: "#F0EDDC" },
  { id: "5", nombre: "Neurología", icono: "pulse-outline", fondo: "#E4DCF0" },
  { id: "6", nombre: "Oftalmología", icono: "eye-outline", fondo: "#DCF0EE" },
] as const;

function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function InicioPantalla(): React.JSX.Element {
  // Reemplazar con useAuthStore() cuando el slice de auth esté integrado !!!!!!!!!!!
  const nombreUsuario = "Ana García";

  const handleAcceso = (ruta: string): void => {
    router.push(ruta as Parameters<typeof router.push>[0]);
  };

  const handleAgendar = (): void => {
    router.push("/(privado)/citas/agendar/paso-1");
  };

  const handleVerCita = (): void => {
    router.push("/(privado)/agenda");
  };

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* */}
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
              <Text style={estilos.avatarLetra}>
                {nombreUsuario.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* */}
        <View style={estilos.banner}>
          <View style={estilos.bannerIzq}>
            <Text style={estilos.bannerLabel}>PRÓXIMA CITA</Text>
            <Text style={estilos.bannerMedico}>{PROXIMA_CITA.medico}</Text>
            <Text style={estilos.bannerEsp}>{PROXIMA_CITA.especialidad}</Text>
            <View style={estilos.bannerFila}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={paleta.white}
              />
              <Text style={estilos.bannerDato}>{PROXIMA_CITA.fecha}</Text>
            </View>
            <View style={estilos.bannerFila}>
              <Ionicons name="time-outline" size={14} color={paleta.white} />
              <Text style={estilos.bannerDato}>{PROXIMA_CITA.hora}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={estilos.bannerBtn}
            onPress={handleVerCita}
            accessibilityLabel="Ver detalle de la próxima cita"
            accessibilityRole="button"
          >
            <Text style={estilos.bannerBtnTexto}>Ver</Text>
            <Ionicons name="arrow-forward" size={14} color={paleta.navy} />
          </TouchableOpacity>
        </View>

        {/* */}
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

        {/* */}
        <View style={estilos.seccionHeader}>
          <Text style={estilos.seccionTitulo}>ESPECIALIDADES</Text>
          <TouchableOpacity onPress={handleAgendar}>
            <Text style={estilos.verTodos}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.grid}>
          {ESPECIALIDADES.map((esp) => (
            <TouchableOpacity
              key={esp.id}
              style={[estilos.espCard, { backgroundColor: esp.fondo }]}
              onPress={handleAgendar}
              accessibilityLabel={`Agendar cita de ${esp.nombre}`}
              accessibilityRole="button"
            >
              <Ionicons name={esp.icono} size={28} color={paleta.navy} />
              <Text style={estilos.espNombre}>{esp.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* */}
        <TouchableOpacity
          style={estilos.btnAgendar}
          onPress={handleAgendar}
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },

  // PERFIL
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

  // MENU
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
