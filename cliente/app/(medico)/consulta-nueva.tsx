import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES, paleta } from "../../constants/theme";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../stores/auth.store";

export default function MedicoConsultaNueva(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [pacienteID, setPacienteID] = useState("");
  const [citaID, setCitaID] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [interrogatorio, setInterrogatorio] = useState("");
  const [exploracion, setExploracion] = useState("");
  const [diagnosticos, setDiagnosticos] = useState("");
  const [tratamiento, setTratamiento] = useState("");

  const enviar = async (): Promise<void> => {
    const pid = parseInt(pacienteID, 10);
    if (!pid) {
      Alert.alert("Datos", "Indica ID de paciente.");
      return;
    }
    const body: Record<string, unknown> = {
      pacienteID: pid,
      identificacion: identificacion || undefined,
      interrogatorio: interrogatorio || undefined,
      exploracionFisica: exploracion || undefined,
      diagnosticos: diagnosticos || undefined,
      tratamiento: tratamiento || undefined,
    };
    const cid = parseInt(citaID, 10);
    if (cid) body.citaID = cid;
    try {
      const res = await fetch(`${API_URL}/medico/consultas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: unknown };
      if (!res.ok) {
        const raw = data.message ?? "Error";
        Alert.alert("Error", Array.isArray(raw) ? raw.join("\n") : String(raw));
        return;
      }
      Alert.alert("Guardado", "Consulta registrada.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Conexión fallida.");
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <Text style={estilos.titulo}>Nota de consulta (NOM-004)</Text>
        <Entrada
          etiqueta="ID PACIENTE *"
          value={pacienteID}
          onChangeText={setPacienteID}
          keyboardType="number-pad"
        />
        <Entrada
          etiqueta="ID CITA (opcional)"
          value={citaID}
          onChangeText={setCitaID}
          keyboardType="number-pad"
        />
        <Entrada
          etiqueta="Identificación / datos relevantes"
          value={identificacion}
          onChangeText={setIdentificacion}
        />
        <Entrada
          etiqueta="Interrogatorio"
          value={interrogatorio}
          onChangeText={setInterrogatorio}
        />
        <Entrada
          etiqueta="Exploración física"
          value={exploracion}
          onChangeText={setExploracion}
        />
        <Entrada
          etiqueta="Diagnósticos"
          value={diagnosticos}
          onChangeText={setDiagnosticos}
        />
        <Entrada
          etiqueta="Tratamiento / plan"
          value={tratamiento}
          onChangeText={setTratamiento}
        />
        <Boton titulo="GUARDAR CONSULTA" alPresionar={() => void enviar()} />
        <TouchableOpacity style={estilos.back} onPress={() => router.back()}>
          <Text style={estilos.backTxt}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 24 },
  titulo: { fontSize: 17, fontWeight: "800", color: paleta.navy, marginBottom: 16 },
  back: { marginTop: 20, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
