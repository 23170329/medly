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
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../../constants/theme";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  cancelarCitaMedico,
  fetchCitaMedico,
  nombrePaciente,
  esCanceladaPorMedico,
  etiquetaCausaCancelacionMedico,
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
  const [cargando, setCargando] = useState(true);
  const [modalCancel, setModalCancel] = useState(false);
  const [causa, setCausa] = useState<CausaCancelacionMedico | "">("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const finalizarCancelacionExitosa = useCallback(
    async (mensaje: string): Promise<void> => {
      setModalCancel(false);
      setCausa("");
      setMotivo("");
      if (token) {
        try {
          const actualizada = await fetchCitaMedico(token, citaId);
          setCita(actualizada);
        } catch {
          /* se recargará al volver a enfocar */
        }
      }
      Alert.alert("Cita cancelada", mensaje, [{ text: "OK" }]);
    },
    [token, citaId],
  );

  const cargar = useCallback(async () => {
    if (!token || !citaId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const data = await fetchCitaMedico(token, citaId);
      setCita(data);
    } catch {
      setCita(null);
    } finally {
      setCargando(false);
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

  const motivoTrim = motivo.trim();
  const motivoValido = motivoTrim.length >= 10;

  const cancelar = async (): Promise<void> => {
    if (!token) return;
    if (!causa) {
      Alert.alert("Revisa", "Selecciona la causa de la cancelación.");
      return;
    }
    if (motivoTrim.length === 0) {
      Alert.alert("Revisa", "El motivo de cancelación es obligatorio.");
      return;
    }
    if (!motivoValido) {
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
      await finalizarCancelacionExitosa(mensaje);
    } catch (e: unknown) {
      try {
        const citaActualizada = await fetchCitaMedico(token, citaId);
        if (
          citaActualizada.estado === "CANCELADA" &&
          esCanceladaPorMedico(citaActualizada)
        ) {
          await finalizarCancelacionExitosa(
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

  const canceladaPorMedico = cita != null && esCanceladaPorMedico(cita);
  const puedeGestionar =
    cita != null &&
    !canceladaPorMedico &&
    (cita.estado === "CONFIRMADA" ||
      cita.estado === "PENDIENTE_PAGO" ||
      cita.estado === "ANTICIPO_REALIZADO");

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="GESTIONAR CITA"
          onAtras={() => router.back()}
        />

        {cargando ? (
          <ActivityIndicator style={estilos.cargando} color={paleta.teal} />
        ) : !cita ? (
          <Text style={estilos.cargandoTxt}>No se encontró la cita.</Text>
        ) : (
          <>
            {canceladaPorMedico ? (
              <View style={estilos.badgeCancelada}>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={paleta.red}
                />
                <Text style={estilos.badgeCanceladaTxt}>
                  Cita cancelada por ti
                </Text>
              </View>
            ) : null}

            <View style={estilos.card}>
              <Text style={estilos.label}>PACIENTE</Text>
              <Text style={estilos.valor}>{nombrePaciente(cita.paciente)}</Text>

              <Text style={[estilos.label, { marginTop: 14 }]}>HORARIO</Text>
              <Text style={estilos.valor}>
                {new Date(cita.inicio).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              <Text style={[estilos.label, { marginTop: 14 }]}>FECHA</Text>
              <Text style={estilos.valor}>
                {new Date(cita.inicio).toLocaleDateString("es-MX", {
                  dateStyle: "full",
                })}
              </Text>

              <Text style={[estilos.label, { marginTop: 14 }]}>TIPO</Text>
              <Text style={estilos.valor}>
                {cita.medico?.especialidad?.nombre ?? "Consulta general"}
              </Text>

              <Text style={[estilos.label, { marginTop: 14 }]}>UBICACIÓN</Text>
              <Text style={estilos.valor}>{cita.sucursal?.nombre ?? "—"}</Text>

              {canceladaPorMedico ? (
                <>
                  <Text style={[estilos.label, { marginTop: 14 }]}>
                    CAUSA DE CANCELACIÓN
                  </Text>
                  <Text style={estilos.valor}>
                    {etiquetaCausaCancelacionMedico(cita.causaCancelacion)}
                  </Text>
                  <View style={estilos.motivoBloque}>
                    <Text style={estilos.motivoLbl}>
                      MOTIVO DE CANCELACIÓN
                    </Text>
                    <Text style={estilos.motivoValor}>
                      {cita.motivoCancelacion?.trim() || "—"}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {puedeGestionar ? (
              <>
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
                  onPress={abrirModalCancelar}
                >
                  <Text style={estilos.btnCancelarTxt}>CANCELAR CITA</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </>
        )}
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
                Mínimo 10 caracteres · {motivoTrim.length}/500
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
                style={[
                  estilos.modalPel,
                  (enviando || !causa || motivoTrim.length === 0) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={() => void cancelar()}
                disabled={enviando || !causa || motivoTrim.length === 0}
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
  cargando: { marginTop: 32 },
  cargandoTxt: { marginTop: 24, color: paleta.teal, textAlign: "center" },
  badgeCancelada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDE8E8",
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 14,
  },
  badgeCanceladaTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.red,
  },
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
  motivoBloque: {
    marginTop: 14,
    backgroundColor: "#F0F7FA",
    borderRadius: BORDES.radio,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: paleta.red,
  },
  motivoLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  motivoValor: {
    fontSize: 14,
    color: paleta.navy,
    lineHeight: 20,
    fontWeight: "600",
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
