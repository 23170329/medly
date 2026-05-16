import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../stores/auth.store";

interface Bloqueo {
  bloqueoID: number;
  inicio: string;
  fin: string;
  motivo?: string | null;
}

export default function MedicoBloqueos(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [lista, setLista] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [ini, setIni] = useState("");
  const [fin, setFin] = useState("");
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/medico/bloqueos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.ok ? ((await res.json()) as Bloqueo[]) : [];
      setLista(Array.isArray(d) ? d : []);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const crear = async (): Promise<void> => {
    if (!ini.trim() || !fin.trim()) {
      Alert.alert("Datos", "Indica inicio y fin en formato ISO (ej. 2026-05-20T14:00:00).");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/medico/bloqueos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inicio: ini.trim(),
          fin: fin.trim(),
          motivo: motivo.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert("Error", String(err.message ?? "No se pudo crear"));
        return;
      }
      setIni("");
      setFin("");
      setMotivo("");
      void cargar();
    } catch {
      Alert.alert("Error", "Conexión fallida.");
    }
  };

  const eliminar = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/medico/bloqueos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        Alert.alert("Error", "No se pudo eliminar");
        return;
      }
      void cargar();
    } catch {
      Alert.alert("Error", "Conexión fallida.");
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void cargar()} />
        }
        contentContainerStyle={estilos.scroll}
      >
        <Text style={estilos.titulo}>Bloqueos de agenda</Text>
        <Text style={estilos.sub}>
          Inhabilita intervalos (fecha/hora en ISO local). Los pacientes no verán slots que choquen con un bloqueo.
        </Text>
        <Entrada etiqueta="INICIO (ISO)" value={ini} onChangeText={setIni} />
        <Entrada etiqueta="FIN (ISO)" value={fin} onChangeText={setFin} />
        <Entrada etiqueta="MOTIVO" value={motivo} onChangeText={setMotivo} />
        <Boton titulo="CREAR BLOQUEO" alPresionar={() => void crear()} />

        <Text style={estilos.sec}>Activos</Text>
        {lista.map((b) => (
          <View key={b.bloqueoID} style={estilos.card}>
            <Text style={estilos.cardTit}>
              {new Date(b.inicio).toLocaleString("es-MX")} —{" "}
              {new Date(b.fin).toLocaleString("es-MX")}
            </Text>
            {b.motivo ? (
              <Text style={estilos.cardSub}>{b.motivo}</Text>
            ) : null}
            <TouchableOpacity onPress={() => void eliminar(b.bloqueoID)}>
              <Text style={estilos.elim}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={estilos.back} onPress={() => router.back()}>
          <Text style={estilos.backTxt}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 24, paddingBottom: 40 },
  titulo: { fontSize: 18, fontWeight: "800", color: paleta.navy },
  sub: { fontSize: 13, color: paleta.teal, marginVertical: 12 },
  sec: {
    marginTop: 24,
    fontWeight: "700",
    color: paleta.teal,
    marginBottom: 10,
  },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 10,
  },
  cardTit: { fontWeight: "600", color: paleta.navy },
  cardSub: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  elim: { marginTop: 8, color: paleta.red, fontWeight: "700" },
  back: { marginTop: 24, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
