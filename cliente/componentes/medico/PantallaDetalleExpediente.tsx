import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "./EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import {
  fetchHistorialExpedientePaciente,
  fetchPacienteMedico,
  nombrePaciente,
  type HistorialExpedienteItemDto,
} from "../../lib/medicoApi";

interface Props {
  readonly pacienteId: number;
  readonly nombreInicial?: string;
}

export function PantallaDetalleExpediente({
  pacienteId,
  nombreInicial,
}: Props): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [nombre, setNombre] = useState(nombreInicial ?? "");
  const [historial, setHistorial] = useState<HistorialExpedienteItemDto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!token || !pacienteId) return;
    setCargando(true);
    try {
      const [pac, items] = await Promise.all([
        fetchPacienteMedico(token, pacienteId).catch(() => null),
        fetchHistorialExpedientePaciente(token, pacienteId),
      ]);
      if (pac) setNombre(nombrePaciente(pac));
      setHistorial(items);
    } catch {
      setHistorial([]);
    } finally {
      setCargando(false);
    }
  }, [token, pacienteId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const renderItem = ({
    item,
  }: {
    item: HistorialExpedienteItemDto;
  }): React.JSX.Element => {
    const fecha = new Date(item.inicio);
    const hora = fecha.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fechaTxt = fecha.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const motivo =
      item.motivo?.trim() ||
      item.diagnostico?.trim() ||
      "Consulta médica";

    return (
      <View style={estilos.tarjeta}>
        <View style={estilos.tarjetaFila}>
          <Ionicons name="calendar-outline" size={18} color={paleta.teal} />
          <Text style={estilos.tarjetaFecha}>{fechaTxt}</Text>
        </View>
        <View style={estilos.tarjetaFila}>
          <Ionicons name="time-outline" size={18} color={paleta.teal} />
          <Text style={estilos.tarjetaHora}>{hora}</Text>
        </View>
        <Text style={estilos.tarjetaLabel}>MOTIVO / DIAGNÓSTICO</Text>
        <Text style={estilos.tarjetaMotivo}>{motivo}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.area}>
      <EncabezadoPantallaMedico
        titulo={nombre || "Paciente"}
        onAtras={() => router.back()}
      />

      <View style={estilos.acciones}>
        <TouchableOpacity
          style={estilos.btnEditar}
          onPress={() =>
            router.push(`/(medico)/expedientes/editar/${pacienteId}`)
          }
        >
          <Ionicons name="create-outline" size={18} color={paleta.navy} />
          <Text style={estilos.btnEditarTxt}>Editar expediente</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator color={paleta.navy} style={{ marginTop: 40 }} />
      ) : historial.length === 0 ? (
        <View style={estilos.vacio}>
          <Ionicons
            name="document-text-outline"
            size={56}
            color={paleta.skyblue}
          />
          <Text style={estilos.vacioTitulo}>Sin consultas registradas</Text>
          <Text style={estilos.vacioSub}>
            Este paciente aún no tiene citas finalizadas contigo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => String(item.citaID)}
          renderItem={renderItem}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  acciones: { paddingHorizontal: 20, paddingBottom: 8 },
  btnEditar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radioPill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  btnEditarTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: paleta.navy,
  },
  lista: { paddingHorizontal: 20, paddingBottom: 32 },
  tarjeta: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
  },
  tarjetaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  tarjetaFecha: {
    fontSize: 15,
    fontWeight: "700",
    color: paleta.navy,
  },
  tarjetaHora: {
    fontSize: 14,
    fontWeight: "600",
    color: paleta.teal,
  },
  tarjetaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  tarjetaMotivo: {
    fontSize: 14,
    color: paleta.navy,
    lineHeight: 20,
  },
  vacio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
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
