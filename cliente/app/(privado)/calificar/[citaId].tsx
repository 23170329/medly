import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { FormularioCalificacionMedico } from "../../../componentes/paciente/FormularioCalificacionMedico";
import {
  enviarCalificacion,
  fetchCita,
  fetchEstadoCalificacionCita,
  marcarNotificacionLeida,
} from "../../../lib/medlyApi";

export default function CalificarMedicoPantalla(): React.JSX.Element {
  const { citaId, notificacionId, nombreMedico } = useLocalSearchParams<{
    citaId: string;
    notificacionId?: string;
    nombreMedico?: string;
  }>();
  const cid = parseInt(citaId ?? "0", 10);
  const nid =
    notificacionId != null ? parseInt(notificacionId, 10) : undefined;

  const [nombre, setNombre] = useState(
    typeof nombreMedico === "string" ? nombreMedico : "tu médico",
  );
  const [cargando, setCargando] = useState(true);
  const [yaCalificada, setYaCalificada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    if (!cid) return;
    setCargando(true);
    try {
      const [cita, estado] = await Promise.all([
        fetchCita(cid),
        fetchEstadoCalificacionCita(cid),
      ]);
      if (cita.medico) {
        setNombre(
          `${cita.medico.nombre} ${cita.medico.apellidoPat}`.trim(),
        );
      }
      setYaCalificada(estado.calificada);
      if (nid != null && !Number.isNaN(nid)) {
        await marcarNotificacionLeida(nid).catch(() => undefined);
      }
    } catch {
      setYaCalificada(false);
    } finally {
      setCargando(false);
    }
  }, [cid, nid]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const enviar = async (
    estrellas: number,
    comentario?: string,
  ): Promise<void> => {
    setEnviando(true);
    try {
      await enviarCalificacion({ citaID: cid, estrellas, comentario });
      Alert.alert(
        "¡Gracias!",
        "Tu calificación ayuda a otros pacientes a elegir mejor.",
        [{ text: "OK", onPress: () => router.replace("/(privado)/inicio") }],
      );
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo enviar la calificación.";
      Alert.alert("Error", msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={estilos.back}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>CALIFICAR MÉDICO</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        {cargando ? (
          <ActivityIndicator color={paleta.navy} style={{ marginTop: 40 }} />
        ) : yaCalificada ? (
          <View style={estilos.vacio}>
            <Ionicons name="checkmark-circle" size={56} color={paleta.green} />
            <Text style={estilos.vacioTitulo}>Ya calificaste esta consulta</Text>
            <Text style={estilos.vacioSub}>
              Gracias por compartir tu experiencia con {nombre}.
            </Text>
          </View>
        ) : (
          <FormularioCalificacionMedico
            nombreMedico={nombre}
            enviando={enviando}
            onEnviar={(estrellas, comentario) => void enviar(estrellas, comentario)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 1,
  },
  scroll: { padding: 24, paddingBottom: 48 },
  vacio: { alignItems: "center", paddingTop: 48 },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 16,
    textAlign: "center",
  },
  vacioSub: {
    fontSize: 14,
    color: paleta.teal,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
