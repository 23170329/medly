import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../../componentes/medico/EncabezadoPantallaMedico";
import { VitalesPesoAltura } from "../../../../componentes/medico/VitalesPesoAltura";
import { SeccionFormulario } from "../../../../componentes/comunes/SeccionFormulario";
import { COLORES, paleta, BORDES } from "../../../../constants/theme";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  crearConsultaMedico,
  fetchPacienteMedico,
  nombrePaciente,
} from "../../../../lib/medicoApi";
import {
  pesoAlturaDesdePaciente,
  validarPesoAltura,
} from "../../../../lib/vitalesPaciente";

export default function GestionarConsultaMedico(): React.JSX.Element {
  const { id, pacienteId } = useLocalSearchParams<{
    id: string;
    pacienteId: string;
  }>();
  const token = useAuthStore((s) => s.accessToken);
  const [nombrePac, setNombrePac] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [presion, setPresion] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [receta, setReceta] = useState("");
  const [errPeso, setErrPeso] = useState<string | undefined>();
  const [errAltura, setErrAltura] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const pid = parseInt(pacienteId ?? "0", 10);
    if (!token || !pid) return;
    setCargando(true);
    try {
      const pac = await fetchPacienteMedico(token, pid);
      setNombrePac(nombrePaciente(pac));
      const v = pesoAlturaDesdePaciente(pac);
      setPeso(v.peso);
      setAltura(v.altura);
    } catch {
      /* sin datos previos */
    } finally {
      setCargando(false);
    }
  }, [token, pacienteId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const finalizar = async (): Promise<void> => {
    const pid = parseInt(pacienteId ?? "0", 10);
    if (!token || !pid) {
      Alert.alert("Error", "Paciente no identificado.");
      return;
    }
    const v = validarPesoAltura(peso, altura);
    setErrPeso(v.errorPeso ?? undefined);
    setErrAltura(v.errorAltura ?? undefined);
    if (v.pesoKg == null || v.alturaM == null) {
      Alert.alert("Revisa", "Peso y altura son obligatorios.");
      return;
    }
    setEnviando(true);
    try {
      await crearConsultaMedico(token, {
        pacienteID: pid,
        citaID: parseInt(id ?? "0", 10) || undefined,
        pesoKg: v.pesoKg,
        alturaM: v.alturaM,
        interrogatorio: motivo.trim() || undefined,
        exploracionFisica: [
          presion ? `PA: ${presion}` : "",
          temperatura ? `Temp: ${temperatura}°C` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        diagnosticos: diagnostico.trim() || undefined,
        estudiosLaboratorio: laboratorio.trim() || undefined,
        tratamiento: receta.trim() || undefined,
      });
      router.replace("/(medico)/citas/exito");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se guardó.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <EncabezadoPantallaMedico
            titulo="GESTIONAR CONSULTA"
            onAtras={() => router.back()}
          />

          {cargando ? (
            <ActivityIndicator color={paleta.navy} style={{ marginTop: 24 }} />
          ) : (
            <>
              <View style={estilos.pacienteCard}>
                <View style={estilos.pacienteAvatar}>
                  <Text style={estilos.pacienteInicial}>
                    {(nombrePac[0] ?? "P").toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.pacienteNombre}>
                    {nombrePac || "Paciente"}
                  </Text>
                  <Text style={estilos.pacienteSub}>Consulta en curso</Text>
                </View>
              </View>

              <SeccionFormulario titulo="Signos vitales" icono="fitness-outline">
                <VitalesPesoAltura
                  pesoKg={peso}
                  alturaM={altura}
                  onPesoChange={(t) => {
                    setPeso(t);
                    setErrPeso(undefined);
                  }}
                  onAlturaChange={(t) => {
                    setAltura(t);
                    setErrAltura(undefined);
                  }}
                  errorPeso={errPeso}
                  errorAltura={errAltura}
                />
                <Campo label="PRESIÓN ARTERIAL" value={presion} onChange={setPresion} placeholder="120/80" />
                <Campo
                  label="TEMPERATURA (°C)"
                  value={temperatura}
                  onChange={setTemperatura}
                  placeholder="36.5"
                />
              </SeccionFormulario>

              <SeccionFormulario titulo="Consulta" icono="clipboard-outline">
                <Campo
                  label="MOTIVO DE CONSULTA"
                  value={motivo}
                  onChange={setMotivo}
                  multiline
                  placeholder="Síntomas, motivo de visita…"
                />
                <Campo
                  label="DIAGNÓSTICO MÉDICO"
                  value={diagnostico}
                  onChange={setDiagnostico}
                  multiline
                  placeholder="Diagnóstico clínico…"
                />
              </SeccionFormulario>

              <SeccionFormulario titulo="Laboratorio" icono="flask-outline">
                <Campo
                  label="ESTUDIOS Y RESULTADOS"
                  value={laboratorio}
                  onChange={setLaboratorio}
                  multiline
                  placeholder="Biometría, química sanguínea, etc."
                />
              </SeccionFormulario>

              <SeccionFormulario titulo="Tratamiento" icono="bandage-outline">
                <Campo
                  label="RECETA / INDICACIONES"
                  value={receta}
                  onChange={setReceta}
                  multiline
                  placeholder="Medicamentos e indicaciones…"
                />
              </SeccionFormulario>
            </>
          )}
        </ScrollView>

        <View style={estilos.pie}>
          <TouchableOpacity
            style={[estilos.btnGuardar, (enviando || cargando) && estilos.disabled]}
            onPress={() => void finalizar()}
            disabled={enviando || cargando}
            accessibilityRole="button"
          >
            {enviando ? (
              <ActivityIndicator color={paleta.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={paleta.white} />
                <Text style={estilos.btnTxt}>FINALIZAR CONSULTA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  multiline?: boolean;
  placeholder?: string;
}): React.JSX.Element {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoLabel}>{label}</Text>
      <TextInput
        style={[estilos.campoInput, multiline && estilos.multiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={COLORES.textoPlaceholder}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 100 },
  pacienteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
  },
  pacienteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  pacienteInicial: { fontSize: 20, fontWeight: "800", color: paleta.navy },
  pacienteNombre: { fontSize: 17, fontWeight: "800", color: paleta.navy },
  pacienteSub: { fontSize: 12, color: paleta.teal, marginTop: 2 },
  campo: { marginBottom: 12 },
  campoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  campoInput: {
    backgroundColor: paleta.beige,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: paleta.navy,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  pie: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    backgroundColor: paleta.white,
    borderTopWidth: 1,
    borderTopColor: paleta.skyblue,
    elevation: 8,
  },
  btnGuardar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
  },
  disabled: { opacity: 0.55 },
  btnTxt: {
    color: paleta.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
