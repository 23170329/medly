import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../../constants/theme";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  cancelarCitaMedico,
  fetchCitasMedico,
  nombrePaciente,
  type CitaMedicoDto,
} from "../../../../lib/medicoApi";

export default function GestionarCitaMedico(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const citaId = parseInt(id ?? "0", 10);
  const token = useAuthStore((s) => s.accessToken);
  const [cita, setCita] = useState<CitaMedicoDto | null>(null);
  const [modalCancel, setModalCancel] = useState(false);

  const cargar = useCallback(async () => {
    if (!token || !citaId) return;
    try {
      const todas = await fetchCitasMedico(token);
      const found = todas.find((c) => c.citaID === citaId) ?? null;
      setCita(found);
    } catch {
      setCita(null);
    }
  }, [token, citaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const cancelar = async (): Promise<void> => {
    if (!token) return;
    setModalCancel(false);
    try {
      const r = await cancelarCitaMedico(token, citaId);
      Alert.alert("Cita cancelada", r.mensaje, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo cancelar.");
    }
  };

  if (!cita) {
    return (
      <SafeAreaView style={estilos.area}>
        <Text style={estilos.cargando}>Cargando cita…</Text>
      </SafeAreaView>
    );
  }

  const ini = new Date(cita.inicio);

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="GESTIONAR CITA"
          onAtras={() => router.back()}
        />

        <View style={estilos.card}>
          <Text style={estilos.label}>PACIENTE</Text>
          <Text style={estilos.valor}>{nombrePaciente(cita.paciente)}</Text>

          <Text style={[estilos.label, { marginTop: 14 }]}>HORARIO</Text>
          <Text style={estilos.valor}>
            {ini.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <Text style={[estilos.label, { marginTop: 14 }]}>FECHA</Text>
          <Text style={estilos.valor}>
            {ini.toLocaleDateString("es-MX", { dateStyle: "full" })}
          </Text>

          <Text style={[estilos.label, { marginTop: 14 }]}>TIPO</Text>
          <Text style={estilos.valor}>
            {cita.medico?.especialidad?.nombre ?? "Consulta general"}
          </Text>

          <Text style={[estilos.label, { marginTop: 14 }]}>UBICACIÓN</Text>
          <Text style={estilos.valor}>{cita.sucursal?.nombre ?? "—"}</Text>
        </View>

        <TouchableOpacity
          style={estilos.btnIniciar}
          onPress={() =>
            router.push({
              pathname: "/(medico)/citas/[id]/consulta",
              params: {
                id: String(citaId),
                pacienteId: String(cita.paciente?.pacienteID ?? ""),
              },
            })
          }
        >
          <Text style={estilos.btnIniciarTxt}>INICIAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnCancelar}
          onPress={() => setModalCancel(true)}
        >
          <Text style={estilos.btnCancelarTxt}>CANCELAR CITA</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalCancel} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitulo}>¿Cancelar esta cita?</Text>
            <View style={estilos.aviso}>
              <Ionicons
                name="warning-outline"
                size={22}
                color={paleta.yellowText}
              />
              <Text style={estilos.avisoTxt}>
                El pago será reembolsado al paciente según la política vigente.
              </Text>
            </View>
            <TouchableOpacity
              style={estilos.modalPrim}
              onPress={() => setModalCancel(false)}
            >
              <Text style={estilos.modalPrimTxt}>CONTINUAR ATENDIENDO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.modalPel}
              onPress={() => void cancelar()}
            >
              <Text style={estilos.modalPelTxt}>CANCELAR CITA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  cargando: { margin: 24, color: paleta.teal },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 18,
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.5,
  },
  valor: {
    fontSize: 16,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 4,
  },
  btnIniciar: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  btnIniciarTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
  btnCancelar: {
    borderWidth: 2,
    borderColor: paleta.red,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnCancelarTxt: { color: paleta.red, fontWeight: "800", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 22,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: paleta.navy,
    textAlign: "center",
    marginBottom: 14,
  },
  aviso: {
    flexDirection: "row",
    backgroundColor: paleta.yellowSoft,
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 18,
    gap: 10,
  },
  avisoTxt: { flex: 1, fontSize: 13, color: paleta.yellowText },
  modalPrim: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalPrimTxt: { color: paleta.white, fontWeight: "800" },
  modalPel: {
    borderWidth: 2,
    borderColor: paleta.red,
    borderRadius: BORDES.radioPill,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalPelTxt: { color: paleta.red, fontWeight: "800" },
});
