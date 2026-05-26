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
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  type CausaCancelacionMedico,
  type CitaMedicoDto,
} from "../../../../lib/medicoApi";

const CAUSAS: { id: CausaCancelacionMedico; etiqueta: string }[] = [
  { id: "EMERGENCIA_MEDICA", etiqueta: "Emergencia médica" },
  { id: "ENFERMEDAD_MEDICO", etiqueta: "Enfermedad del médico" },
  { id: "CONFLICTO_AGENDA", etiqueta: "Conflicto de agenda" },
  { id: "REAGENDAMIENTO", etiqueta: "Reagendamiento" },
  { id: "OTRO", etiqueta: "Otro" },
];

export default function GestionarCitaMedico(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const citaId = parseInt(id ?? "0", 10);
  const token = useAuthStore((s) => s.accessToken);
  const [cita, setCita] = useState<CitaMedicoDto | null>(null);
  const [modalCancel, setModalCancel] = useState(false);
  const [causa, setCausa] = useState<CausaCancelacionMedico | "">("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  // FIX: Unificamos el cierre del modal y la navegación tras una cancelación exitosa.
  const finalizarCancelacionExitosa = useCallback((mensaje: string): void => {
    setModalCancel(false);
    setCausa("");
    setMotivo("");
    setCita(null);
    Alert.alert("Cita cancelada", mensaje, [
      {
        text: "OK",
        onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(medico)/agenda");
          }
        },
      },
    ]);
  }, []);

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

  const abrirModalCancelar = (): void => {
    setCausa("");
    setMotivo("");
    setModalCancel(true);
  };

  const cancelar = async (): Promise<void> => {
    if (!token || !causa) {
      Alert.alert("Revisa", "Selecciona la causa de la cancelación.");
      return;
    }
    const motivoTrim = motivo.trim();
    if (motivoTrim.length < 10) {
      Alert.alert(
        "Revisa",
        "Describe el motivo de la cancelación (mínimo 10 caracteres).",
      );
      return;
    }
    setEnviando(true);
    try {
      const r = await cancelarCitaMedico(token, citaId, {
        causa,
        motivo: motivoTrim,
      });
      const mensaje =
        r.mensaje ?? "La cita ha sido cancelada correctamente.";
      finalizarCancelacionExitosa(mensaje);
    } catch (e: unknown) {
      // FIX: Si el backend respondió error pero la cita ya quedó cancelada, tratamos el resultado como éxito.
      try {
        const todas = await fetchCitasMedico(token);
        const citaActualizada = todas.find((item) => item.citaID === citaId) ?? null;
        if (citaActualizada?.estado === "CANCELADA") {
          finalizarCancelacionExitosa(
            "La cita sí fue cancelada correctamente.",
          );
          return;
        }
      } catch {
        /* ignore */
      }
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo cancelar.");
    } finally {
      setEnviando(false);
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

        <TouchableOpacity style={estilos.btnCancelar} onPress={abrirModalCancelar}>
          <Text style={estilos.btnCancelarTxt}>CANCELAR CITA</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalCancel} transparent animationType="fade">
        <KeyboardAvoidingView
          style={estilos.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={estilos.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={estilos.modalCard}>
              <Text style={estilos.modalTitulo}>Cancelar cita</Text>
              <Text style={estilos.modalSub}>
                Indica la causa y el motivo. El paciente recibirá una
                notificación en su campana.
              </Text>

              <Text style={estilos.campoLbl}>CAUSA</Text>
              <View style={estilos.causasWrap}>
                {CAUSAS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      estilos.causaChip,
                      causa === c.id && estilos.causaChipActiva,
                    ]}
                    onPress={() => setCausa(c.id)}
                  >
                    <Text
                      style={[
                        estilos.causaChipTxt,
                        causa === c.id && estilos.causaChipTxtActiva,
                      ]}
                    >
                      {c.etiqueta}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={estilos.campoLbl}>MOTIVO (obligatorio)</Text>
              <TextInput
                style={estilos.motivoInput}
                placeholder="Explica por qué se cancela la cita…"
                placeholderTextColor={COLORES.textoPlaceholder}
                value={motivo}
                onChangeText={setMotivo}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={estilos.motivoHint}>
                Mínimo 10 caracteres · {motivo.trim().length}/500
              </Text>

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
                disabled={enviando}
              >
                <Text style={estilos.modalPrimTxt}>CONTINUAR ATENDIENDO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalPel, enviando && { opacity: 0.6 }]}
                onPress={() => void cancelar()}
                disabled={enviando}
              >
                <Text style={estilos.modalPelTxt}>
                  {enviando ? "CANCELANDO…" : "CONFIRMAR CANCELACIÓN"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
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
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: paleta.teal,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  campoLbl: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  causasWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  causaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDES.radioPill,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    backgroundColor: paleta.white,
  },
  causaChipActiva: {
    backgroundColor: paleta.navy,
    borderColor: paleta.navy,
  },
  causaChipTxt: { fontSize: 12, fontWeight: "600", color: paleta.navy },
  causaChipTxtActiva: { color: paleta.white },
  motivoInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    borderRadius: BORDES.radio,
    padding: 12,
    fontSize: 14,
    color: paleta.navy,
    backgroundColor: paleta.white,
    marginBottom: 4,
  },
  motivoHint: {
    fontSize: 11,
    color: paleta.teal,
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
