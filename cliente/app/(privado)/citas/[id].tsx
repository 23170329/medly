import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
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
  const [modalCancelar, setModalCancelar] = useState(false);

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

  const ejecutarCancelacion = async (): Promise<void> => {
    if (!cita) return;
    setModalCancelar(false);
    try {
      if (cita.estado === "PENDIENTE_PAGO") {
        await abandonarReserva(cita.citaID);
        Alert.alert("Listo", "Se liberó la reserva pendiente de pago.");
      } else {
        const r = await cancelarCita(cita.citaID);
        Alert.alert("Resultado", r.mensaje);
      }
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo cancelar.");
    }
  };

  const textoPoliticaCancel = useMemo((): string => {
    if (!cita) return "";
    if (cita.estado === "PENDIENTE_PAGO") {
      return "Aún no se ha completado el pago. Si abandonas la reserva, podrás elegir otro horario sin cargo.";
    }
    const ini = new Date(cita.inicio).getTime();
    const horas = (ini - Date.now()) / (1000 * 60 * 60);
    if (horas >= 24) {
      return `Si cancelas con al menos 24 horas de anticipación, el anticipo (${cita.montoAnticipo} MXN) puede acreditarse según tu método de pago y tiempos del proveedor.`;
    }
    return "Estás dentro de la ventana de menos de 24 horas antes de la cita. El anticipo no es reembolsable salvo políticas excepcionales del centro.";
  }, [cita]);

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

      <Modal
        visible={modalCancelar}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCancelar(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitulo}>¿Cancelar esta cita?</Text>
            <View style={estilos.modalAviso}>
              <Ionicons
                name="warning-outline"
                size={22}
                color={paleta.yellowText}
                style={{ marginRight: 10 }}
              />
              <Text style={estilos.modalAvisoTxt}>{textoPoliticaCancel}</Text>
            </View>
            <TouchableOpacity
              style={estilos.modalBtnPrim}
              onPress={() => setModalCancelar(false)}
              accessibilityRole="button"
            >
              <Text style={estilos.modalBtnPrimTxt}>Conservar cita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.modalBtnPel}
              onPress={() => void ejecutarCancelacion()}
              accessibilityRole="button"
            >
              <Text style={estilos.modalBtnPelTxt}>Sí, cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          <TouchableOpacity
            style={estilos.btnCancel}
            onPress={() => setModalCancelar(true)}
          >
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
    backgroundColor: paleta.headerBar,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: BORDES.radio + 6,
    borderBottomRightRadius: BORDES.radio + 6,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: paleta.white,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(47,65,86,0.45)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio + 4,
    padding: 22,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    marginBottom: 16,
    textAlign: "center",
  },
  modalAviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: paleta.yellowSoft,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(241,196,15,0.45)",
  },
  modalAvisoTxt: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: paleta.yellowText,
    fontWeight: "500",
  },
  modalBtnPrim: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalBtnPrimTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.white,
  },
  modalBtnPel: {
    borderWidth: 2,
    borderColor: paleta.red,
    borderRadius: BORDES.radioPill,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: paleta.white,
  },
  modalBtnPelTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.red,
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
