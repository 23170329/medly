import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../../constants/theme";
import { useAuthStore } from "../../../../stores/auth.store";
import { fetchCitaRecepcion } from "../../../../lib/recepcionApi";
import { nombrePaciente, type CitaMedicoDto } from "../../../../lib/medicoApi";
import { etiquetaEstadoCita } from "../../../../lib/estadoCita";

export default function RecepcionCitaDetalle(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.accessToken);
  const [cita, setCita] = useState<CitaMedicoDto | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const cid = parseInt(id ?? "0", 10);
    if (!cid || !token) return;
    setCargando(true);
    try {
      const data = await fetchCitaRecepcion(token, cid);
      setCita(data);
    } catch {
      setCita(null);
    } finally {
      setCargando(false);
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (cargando) {
    return (
      <SafeAreaView style={estilos.area}>
        <ActivityIndicator style={{ marginTop: 40 }} color={paleta.navy} />
      </SafeAreaView>
    );
  }

  if (!cita) {
    return (
      <SafeAreaView style={estilos.area}>
        <EncabezadoPantallaMedico
          titulo="DETALLE DE CITA"
          onAtras={() => router.back()}
        />
        <Text style={estilos.error}>No se encontró la cita.</Text>
      </SafeAreaView>
    );
  }

  const ini = new Date(cita.inicio);
  const med = cita.medico
    ? `${cita.medico.nombre} ${cita.medico.apellidoPat}`
    : "—";
  const tel = cita.paciente?.telefono ?? "";

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="DETALLE DE CITA"
          onAtras={() => router.back()}
        />

        <View style={estilos.card}>
          <Text style={estilos.estado}>
            {etiquetaEstadoCita({ ...cita, pagos: [] } as Parameters<typeof etiquetaEstadoCita>[0])}
          </Text>
          <Text style={estilos.fecha}>
            {ini.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={estilos.hora}>
            {ini.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.secTit}>PACIENTE</Text>
          <Text style={estilos.valor}>{nombrePaciente(cita.paciente)}</Text>
          {tel ? <Text style={estilos.sub}>{tel}</Text> : null}
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.secTit}>MÉDICO Y ESPECIALIDAD</Text>
          <Text style={estilos.valor}>{med}</Text>
          <Text style={estilos.sub}>
            {cita.medico?.especialidad?.nombre ?? "Consulta médica"}
          </Text>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.secTit}>SUCURSAL</Text>
          <Text style={estilos.valor}>{cita.sucursal?.nombre ?? "—"}</Text>
          {cita.sucursal?.direccion ? (
            <Text style={estilos.sub}>{cita.sucursal.direccion}</Text>
          ) : null}
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.secTit}>PAGO</Text>
          <Text style={estilos.valor}>Total: ${cita.montoTotal} MXN</Text>
          <Text style={estilos.sub}>Anticipo 50%: ${cita.montoAnticipo} MXN</Text>
        </View>

        {tel ? (
          <TouchableOpacity
            style={estilos.btnLlamar}
            onPress={() =>
              router.push({
                pathname: "/(recepcion)/citas/[id]/llamar",
                params: {
                  id: String(cita.citaID),
                  telefono: tel,
                  paciente: nombrePaciente(cita.paciente),
                },
              })
            }
          >
            <Ionicons name="call-outline" size={20} color={paleta.white} />
            <Text style={estilos.btnLlamarTxt}>LLAMAR PARA CONFIRMAR</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  error: { textAlign: "center", color: paleta.teal, marginTop: 24 },
  card: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio,
    padding: 18,
    marginBottom: 20,
  },
  estado: {
    fontSize: 12,
    fontWeight: "700",
    color: paleta.skyblue,
    letterSpacing: 0.5,
  },
  fecha: {
    fontSize: 17,
    fontWeight: "700",
    color: paleta.white,
    marginTop: 8,
  },
  hora: { fontSize: 15, color: paleta.skyblue, marginTop: 4 },
  seccion: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 12,
  },
  secTit: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  valor: { fontSize: 15, fontWeight: "700", color: paleta.navy },
  sub: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  btnLlamar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    marginTop: 8,
  },
  btnLlamarTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
});
