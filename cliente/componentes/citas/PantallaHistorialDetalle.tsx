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
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SeccionFormulario } from "../comunes/SeccionFormulario";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import type { HistorialCitaItem } from "./PantallaHistorialCitas";

export interface ConsultaHistorialDto {
  consultaID?: number;
  fechaRegistro?: string;
  interrogatorio?: string | null;
  exploracionFisica?: string | null;
  diagnosticos?: string | null;
  tratamiento?: string | null;
  estudiosLaboratorio?: string | null;
  pesoKg?: number | string | null;
  alturaM?: number | string | null;
}

interface Props {
  readonly titulo: string;
  readonly rol: "paciente" | "medico";
  readonly cargarDetalle: () => Promise<{
    cita: HistorialCitaItem;
    consulta: ConsultaHistorialDto | null;
  }>;
  readonly subtituloPersona: (cita: HistorialCitaItem) => string;
}

function CampoSoloLectura({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}): React.JSX.Element | null {
  if (!value?.trim()) return null;
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoLabel}>{label}</Text>
      <Text style={estilos.campoValor}>{value}</Text>
    </View>
  );
}

export function PantallaHistorialDetalle({
  titulo,
  rol,
  cargarDetalle,
  subtituloPersona,
}: Props): React.JSX.Element {
  const [cita, setCita] = useState<HistorialCitaItem | null>(null);
  const [consulta, setConsulta] = useState<ConsultaHistorialDto | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await cargarDetalle();
      setCita(data.cita);
      setConsulta(data.consulta);
    } catch {
      setCita(null);
      setConsulta(null);
    } finally {
      setCargando(false);
    }
  }, [cargarDetalle]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (cargando) {
    return (
      <SafeAreaView style={estilos.area}>
        <ActivityIndicator color={paleta.navy} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!cita) {
    return (
      <SafeAreaView style={estilos.area}>
        <Text style={estilos.error}>No se encontró el historial.</Text>
      </SafeAreaView>
    );
  }

  const ini = new Date(cita.inicio);
  const fin = cita.fin ? new Date(cita.fin) : null;

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>{titulo}</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.hero}>
          <Text style={estilos.heroNombre}>{subtituloPersona(cita)}</Text>
          <Text style={estilos.heroSub}>
            {rol === "paciente"
              ? (cita.medico?.especialidad?.nombre ?? "Consulta médica")
              : (cita.sucursal?.nombre ?? "Sucursal")}
          </Text>
          <View style={estilos.badge}>
            <Ionicons name="checkmark-circle" size={14} color={paleta.green} />
            <Text style={estilos.badgeTxt}>Cita completada</Text>
          </View>
        </View>

        <SeccionFormulario titulo="Datos de la cita" icono="calendar-outline">
          <CampoSoloLectura
            label="FECHA"
            value={ini.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <CampoSoloLectura
            label="HORARIO"
            value={`${ini.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}${
              fin
                ? ` – ${fin.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
                : ""
            }`}
          />
          <CampoSoloLectura label="SUCURSAL" value={cita.sucursal?.nombre} />
          <CampoSoloLectura label="DIRECCIÓN" value={cita.sucursal?.direccion} />
          {cita.montoTotal ? (
            <CampoSoloLectura
              label="TOTAL CONSULTA"
              value={`$${Math.round(parseFloat(cita.montoTotal))} MXN`}
            />
          ) : null}
        </SeccionFormulario>

        {consulta ? (
          <>
            <SeccionFormulario titulo="Consulta clínica" icono="medkit-outline">
              <CampoSoloLectura label="MOTIVO" value={consulta.interrogatorio} />
              <CampoSoloLectura label="EXPLORACIÓN" value={consulta.exploracionFisica} />
              {consulta.pesoKg != null && consulta.alturaM != null ? (
                <CampoSoloLectura
                  label="DATOS FISICOS"
                  value={`Peso: ${consulta.pesoKg} kg · Altura: ${consulta.alturaM} m`}
                />
              ) : null}
              <CampoSoloLectura label="DIAGNÓSTICO" value={consulta.diagnosticos} />
              <CampoSoloLectura label="TRATAMIENTO" value={consulta.tratamiento} />
            </SeccionFormulario>
            {consulta.estudiosLaboratorio?.trim() ? (
              <SeccionFormulario titulo="Laboratorio" icono="flask-outline">
                <CampoSoloLectura
                  label="RESULTADOS"
                  value={consulta.estudiosLaboratorio}
                />
              </SeccionFormulario>
            ) : null}
          </>
        ) : (
          <View style={estilos.aviso}>
            <Text style={estilos.avisoTxt}>
              No hay notas clínicas registradas para esta cita.
            </Text>
          </View>
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
  tituloHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 0.5,
  },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: paleta.green,
  },
  heroNombre: { fontSize: 18, fontWeight: "800", color: paleta.navy },
  heroSub: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#DCF0E4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: paleta.green },
  campo: { marginBottom: 12 },
  campoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  campoValor: { fontSize: 14, color: paleta.navy, lineHeight: 20 },
  aviso: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
  },
  avisoTxt: { fontSize: 13, color: paleta.teal, textAlign: "center" },
  error: { textAlign: "center", marginTop: 40, color: paleta.teal },
});
