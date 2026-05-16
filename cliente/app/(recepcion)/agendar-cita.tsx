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

export default function RecepcionAgendarCita(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [pacienteId, setPacienteId] = useState("");
  const [slotID, setSlotID] = useState("");

  const enviar = async (): Promise<void> => {
    const pid = parseInt(pacienteId, 10);
    const sid = parseInt(slotID, 10);
    if (!pid || !sid) {
      Alert.alert("Datos", "Indica pacienteID y slotID numéricos.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/recepcion/citas/mostrador`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pacienteId: pid, slotID: sid }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: unknown };
      if (!res.ok) {
        const raw = data.message ?? "No se pudo crear la cita";
        Alert.alert("Error", Array.isArray(raw) ? raw.join("\n") : String(raw));
        return;
      }
      Alert.alert("Listo", "Cita confirmada en mostrador.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Conexión fallida.");
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <Text style={estilos.titulo}>Cita en mostrador</Text>
        <Text style={estilos.sub}>
          Confirma cita para un paciente existente usando IDs (pacienteID y slotID libre).
        </Text>
        <Entrada
          etiqueta="ID PACIENTE"
          value={pacienteId}
          onChangeText={setPacienteId}
          keyboardType="number-pad"
        />
        <Entrada
          etiqueta="ID SLOT (HORARIO)"
          value={slotID}
          onChangeText={setSlotID}
          keyboardType="number-pad"
        />
        <Boton titulo="CONFIRMAR CITA" alPresionar={() => void enviar()} />
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
  titulo: { fontSize: 18, fontWeight: "800", color: paleta.navy, marginBottom: 8 },
  sub: { fontSize: 13, color: paleta.teal, marginBottom: 20 },
  back: { marginTop: 24, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
