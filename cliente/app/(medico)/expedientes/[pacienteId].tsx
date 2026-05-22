import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { Entrada } from "../../../componentes/comunes/Entrada";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";
import { fetchConsultasMedico } from "../../../lib/medicoApi";

export default function ExpedienteDetalle(): React.JSX.Element {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const pid = parseInt(pacienteId ?? "0", 10);
  const token = useAuthStore((s) => s.accessToken);

  const [alergias, setAlergias] = useState("");
  const [historia, setHistoria] = useState("");
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [ultima, setUltima] = useState("");

  const cargar = useCallback(async () => {
    if (!token || !pid) return;
    try {
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
        const ex = ult.exploracionFisica ?? "";
        const mPeso = ex.match(/peso[:\s]*([\d.]+)/i);
        const mTalla = ex.match(/talla[:\s]*([\d.]+)/i);
        if (mPeso) setPeso(mPeso[1]);
        if (mTalla) setTalla(mTalla[1]);
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
        <View style={estilos.fila}>
          <View style={estilos.mitad}>
            <Entrada etiqueta="PESO (KG)" value={peso} onChangeText={setPeso} />
          </View>
          <View style={estilos.mitad}>
            <Entrada etiqueta="TALLA (CM)" value={talla} onChangeText={setTalla} />
          </View>
        </View>
        <Campo
          label="TRATAMIENTO ACTUAL"
          value={tratamiento}
          onChange={setTratamiento}
          multiline
        />
        <Campo label="ÚLTIMA ACTUALIZACIÓN" value={ultima} onChange={setUltima} />
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
      <Text style={estilos.campoLabel}>{label}</Text>
      <TextInput
        style={[estilos.campoInput, multiline && estilos.multiline]}
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
  fila: { flexDirection: "row", gap: 12 },
  mitad: { flex: 1 },
});
