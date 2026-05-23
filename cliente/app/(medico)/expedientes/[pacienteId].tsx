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
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { VitalesPesoAltura } from "../../../componentes/medico/VitalesPesoAltura";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";
import {
  fetchConsultasMedico,
  fetchPacienteMedico,
  guardarExpedienteMedico,
  nombrePaciente,
} from "../../../lib/medicoApi";
import {
  pesoAlturaDesdePaciente,
  validarPesoAltura,
} from "../../../lib/vitalesPaciente";

export default function ExpedienteDetalle(): React.JSX.Element {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const pid = parseInt(pacienteId ?? "0", 10);
  const token = useAuthStore((s) => s.accessToken);

  const [nombrePac, setNombrePac] = useState("");
  const [alergias, setAlergias] = useState("");
  const [historia, setHistoria] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [ultima, setUltima] = useState("—");
  const [errPeso, setErrPeso] = useState<string | undefined>();
  const [errAltura, setErrAltura] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!token || !pid) return;
    setCargando(true);
    try {
      const pac = await fetchPacienteMedico(token, pid);
      setNombrePac(nombrePaciente(pac));
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
        if (!vitales.altura && ult.alturaM != null)
          setAltura(String(ult.alturaM));
      }
    } catch {
      /* vacío */
    } finally {
      setCargando(false);
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
            titulo="EXPEDIENTE"
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
                  <Text style={estilos.pacienteSub}>Expediente clínico</Text>
                </View>
              </View>

              <Seccion titulo="Datos clínicos" icono="medkit-outline">
                <Campo
                  label="ALERGIAS"
                  value={alergias}
                  onChange={setAlergias}
                  multiline
                  placeholder="Ej. penicilina, polen…"
                />
                <Campo
                  label="HISTORIA RELEVANTE"
                  value={historia}
                  onChange={setHistoria}
                  multiline
                  placeholder="Antecedentes, cirugías, enfermedades crónicas…"
                />
              </Seccion>

              <Seccion titulo="Datos físicos" icono="fitness-outline">
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
              </Seccion>

              <Seccion titulo="Tratamiento" icono="bandage-outline">
                <Campo
                  label="TRATAMIENTO ACTUAL"
                  value={tratamiento}
                  onChange={setTratamiento}
                  multiline
                  placeholder="Medicamentos, indicaciones…"
                />
              </Seccion>

              <View style={estilos.metaCard}>
                <Ionicons name="time-outline" size={18} color={paleta.teal} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.metaLabel}>ÚLTIMA ACTUALIZACIÓN</Text>
                  <Text style={estilos.metaValor}>{ultima}</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={estilos.pie}>
          <TouchableOpacity
            style={[
              estilos.btnGuardar,
              (guardando || cargando) && estilos.btnGuardarDisabled,
            ]}
            onPress={() => void guardar()}
            disabled={guardando || cargando}
            accessibilityRole="button"
            accessibilityLabel="Guardar expediente"
          >
            {guardando ? (
              <ActivityIndicator color={paleta.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={paleta.white} />
                <Text style={estilos.btnGuardarTxt}>GUARDAR EXPEDIENTE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={estilos.seccion}>
      <View style={estilos.seccionHeader}>
        <Ionicons name={icono} size={18} color={paleta.teal} />
        <Text style={estilos.seccionTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
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
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pacienteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  pacienteInicial: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.navy,
  },
  pacienteNombre: {
    fontSize: 17,
    fontWeight: "800",
    color: paleta.navy,
  },
  pacienteSub: {
    fontSize: 12,
    color: paleta.teal,
    marginTop: 2,
  },
  seccion: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 14,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: paleta.skyblue,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.3,
  },
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
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.4,
  },
  metaValor: {
    fontSize: 14,
    fontWeight: "600",
    color: paleta.navy,
    marginTop: 2,
  },
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
    shadowColor: paleta.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
  btnGuardarDisabled: { opacity: 0.55 },
  btnGuardarTxt: {
    color: paleta.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
