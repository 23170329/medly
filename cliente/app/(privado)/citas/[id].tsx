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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import {
  fetchCita,
  cancelarCita,
  abandonarReserva,
  type CitaDto,
} from "../../../lib/medlyApi";

export default function CitaDetallePantalla(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cita, setCita] = useState<CitaDto | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const cid = parseInt(id ?? "0", 10);
    if (!cid) return;
    setCargando(true);
    try {
      const data = await fetchCita(cid);
      setCita(data);
    } catch {
      setCita(null);
      Alert.alert("Error", "No se pudo cargar la cita.");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const cancelar = (): void => {
    if (!cita) return;
    Alert.alert("Cancelar cita", "¿Confirmas cancelar esta cita?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        style: "destructive",
        onPress: async () => {
          try {
            if (cita.estado === "PENDIENTE_PAGO") {
              await abandonarReserva(cita.citaID);
            } else {
              const r = await cancelarCita(cita.citaID);
              Alert.alert("Resultado", r.mensaje);
            }
            router.back();
          } catch {
            Alert.alert("Error", "No se pudo cancelar.");
          }
        },
      },
    ]);
  };

  if (cargando || !cita) {
    return (
      <SafeAreaView style={estilos.area}>
        <ActivityIndicator style={{ marginTop: 40 }} color={paleta.navy} />
      </SafeAreaView>
    );
  }

  const ini = new Date(cita.inicio);
  const med = cita.medico
    ? `${cita.medico.nombre} ${cita.medico.apellidoPat}`
    : "—";
  const esp = cita.medico?.especialidad?.nombre ?? "—";

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.top}>
        <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>DETALLE DE CITA</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.card}>
          <Text style={estilos.label}>Estado</Text>
          <Text style={estilos.valor}>{cita.estado.replace("_", " ")}</Text>

          <Text style={[estilos.label, { marginTop: 16 }]}>Médico</Text>
          <Text style={estilos.valor}>{med}</Text>
          <Text style={estilos.sub}>{esp}</Text>

          <Text style={[estilos.label, { marginTop: 16 }]}>Sucursal</Text>
          <Text style={estilos.valor}>{cita.sucursal?.nombre ?? "—"}</Text>
          <Text style={estilos.sub}>{cita.sucursal?.direccion}</Text>

          <Text style={[estilos.label, { marginTop: 16 }]}>Fecha y hora</Text>
          <Text style={estilos.valor}>
            {ini.toLocaleString("es-MX", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>

          <Text style={[estilos.label, { marginTop: 16 }]}>Montos</Text>
          <Text style={estilos.valor}>
            Total: ${cita.montoTotal} MXN · Anticipo (50%): ${cita.montoAnticipo}{" "}
            MXN
          </Text>
        </View>

        {(cita.estado === "CONFIRMADA" || cita.estado === "PENDIENTE_PAGO") && (
          <TouchableOpacity style={estilos.btnCancel} onPress={cancelar}>
            <Text style={estilos.btnCancelTxt}>Cancelar cita</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  top: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontSize: 16,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 1,
  },
  scroll: { padding: 24 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 1,
  },
  valor: { fontSize: 16, fontWeight: "600", color: paleta.navy, marginTop: 4 },
  sub: { fontSize: 13, color: paleta.teal, marginTop: 2 },
  btnCancel: {
    borderWidth: 1.5,
    borderColor: paleta.red,
    borderRadius: BORDES.radio,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnCancelTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.red,
  },
});
