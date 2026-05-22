import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EncabezadoPantallaMedico } from "../../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../../constants/theme";
import { useAuthStore } from "../../../../stores/auth.store";
import { crearConsultaMedico } from "../../../../lib/medicoApi";

export default function GestionarConsultaMedico(): React.JSX.Element {
  const { id, pacienteId } = useLocalSearchParams<{
    id: string;
    pacienteId: string;
  }>();
  const token = useAuthStore((s) => s.accessToken);
  const [paso, setPaso] = useState(1);
  const [presion, setPresion] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [receta, setReceta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const finalizar = async (): Promise<void> => {
    const pid = parseInt(pacienteId ?? "0", 10);
    if (!token || !pid) {
      Alert.alert("Error", "Paciente no identificado.");
      return;
    }
    setEnviando(true);
    try {
      await crearConsultaMedico(token, {
        pacienteID: pid,
        citaID: parseInt(id ?? "0", 10) || undefined,
        interrogatorio: motivo || undefined,
        exploracionFisica: [
          presion ? `PA: ${presion}` : "",
          temperatura ? `Temp: ${temperatura}°C` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        diagnosticos: diagnostico || undefined,
        tratamiento: receta || undefined,
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
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="GESTIONAR CONSULTA"
          onAtras={() => (paso === 1 ? router.back() : setPaso(1))}
        />

        {paso === 1 ? (
          <>
            <Campo label="PRESIÓN ARTERIAL" value={presion} onChange={setPresion} />
            <Campo
              label="TEMPERATURA (°C)"
              value={temperatura}
              onChange={setTemperatura}
            />
            <Campo
              label="MOTIVO DE CONSULTA"
              value={motivo}
              onChange={setMotivo}
              multiline
            />
            <Campo
              label="DIAGNÓSTICO MÉDICO"
              value={diagnostico}
              onChange={setDiagnostico}
              multiline
            />
            <TouchableOpacity
              style={estilos.btn}
              onPress={() => setPaso(2)}
            >
              <Text style={estilos.btnTxt}>SIGUIENTE →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={estilos.labelReceta}>RECETA</Text>
            <TextInput
              style={estilos.receta}
              value={receta}
              onChangeText={setReceta}
              multiline
              placeholder="Indicaciones y medicamentos…"
              placeholderTextColor={COLORES.textoPlaceholder}
            />
            <TouchableOpacity
              style={[estilos.btn, enviando && { opacity: 0.7 }]}
              onPress={() => void finalizar()}
              disabled={enviando}
            >
              <Text style={estilos.btnTxt}>
                {enviando ? "GUARDANDO…" : "FINALIZAR"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  multiline?: boolean;
}): React.JSX.Element {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.label}>{label}</Text>
      <TextInput
        style={[estilos.input, multiline && estilos.multiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={COLORES.textoPlaceholder}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  campo: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    padding: 12,
    fontSize: 15,
    color: paleta.navy,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  labelReceta: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 8,
  },
  receta: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    minHeight: 200,
    padding: 14,
    fontSize: 15,
    color: paleta.navy,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  btn: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
});
