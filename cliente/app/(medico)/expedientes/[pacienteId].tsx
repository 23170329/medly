import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { Boton } from "../../../componentes/comunes/Boton";
import { VitalesPesoAltura } from "../../../componentes/medico/VitalesPesoAltura";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";
import {
  fetchConsultasMedico,
  fetchPacienteMedico,
  guardarExpedienteMedico,
} from "../../../lib/medicoApi";
import {
  pesoAlturaDesdePaciente,
  validarPesoAltura,
} from "../../../lib/vitalesPaciente";

export default function ExpedienteDetalle(): React.JSX.Element {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const pid = parseInt(pacienteId ?? "0", 10);
  const token = useAuthStore((s) => s.accessToken);

  const [alergias, setAlergias] = useState("");
  const [historia, setHistoria] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [ultima, setUltima] = useState("");
  const [errPeso, setErrPeso] = useState<string | undefined>();
  const [errAltura, setErrAltura] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!token || !pid) return;
    try {
      const pac = await fetchPacienteMedico(token, pid);
      const vitales = pesoAlturaDesdePaciente(pac);
      setPeso(vitales.peso);
      setAltura(vitales.altura);

      const cons = await fetchConsultasMedico(token, pid);
      const ult = cons[0];
      if (ult) {
        setAlergias(ult.identificacion ?? "");
        setHistoria(ult.antecedentes ?? "");
        setTratamiento(ult.tratamiento ?? "");
        setUltima(
          new Date(ult.fechaRegistro).toLocaleDateString("es-MX", {
            dateStyle: "medium",
          }),
        );
        if (!vitales.peso && ult.pesoKg != null) setPeso(String(ult.pesoKg));
        if (!vitales.altura && ult.alturaM != null) setAltura(String(ult.alturaM));
      }
    } catch {
      /* vacío */
    }
  }, [token, pid]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const guardar = async (): Promise<void> => {
    if (!token || !pid) return;
    const v = validarPesoAltura(peso, altura);
    setErrPeso(v.errorPeso ?? undefined);
    setErrAltura(v.errorAltura ?? undefined);
    if (v.pesoKg == null || v.alturaM == null) {
      Alert.alert("Revisa", "Peso y altura son obligatorios en el expediente.");
      return;
    }
    setGuardando(true);
    try {
      await guardarExpedienteMedico(token, pid, {
        identificacion: alergias.trim() || undefined,
        antecedentes: historia.trim() || undefined,
        tratamiento: tratamiento.trim() || undefined,
        pesoKg: v.pesoKg,
        alturaM: v.alturaM,
      });
      setUltima(
        new Date().toLocaleDateString("es-MX", { dateStyle: "medium" }),
      );
      Alert.alert("Guardado", "Expediente actualizado correctamente.");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se guardó.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="EXPEDIENTE"
          onAtras={() => router.back()}
        />

        <Campo label="ALERGIAS" value={alergias} onChange={setAlergias} multiline />
        <Campo
          label="HISTORIA RELEVANTE"
          value={historia}
          onChange={setHistoria}
          multiline
        />
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
        <Campo
          label="TRATAMIENTO ACTUAL"
          value={tratamiento}
          onChange={setTratamiento}
          multiline
        />
        <Campo
          label="ÚLTIMA ACTUALIZACIÓN"
          value={ultima}
          onChange={setUltima}
          editable={false}
        />
        <Boton
          titulo={guardando ? "GUARDANDO…" : "GUARDAR EXPEDIENTE"}
          alPresionar={() => void guardar()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  value,
  onChange,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  multiline?: boolean;
  editable?: boolean;
}): React.JSX.Element {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoLabel}>{label}</Text>
      <TextInput
        style={[estilos.campoInput, multiline && estilos.multiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        editable={editable}
        placeholderTextColor={COLORES.textoPlaceholder}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  campo: { marginBottom: 14 },
  campoLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  campoInput: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: paleta.navy,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
});
