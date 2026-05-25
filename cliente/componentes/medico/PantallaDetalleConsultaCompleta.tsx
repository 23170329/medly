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
import {
  fetchHistorialDetalleMedicoAuthed,
  nombrePaciente,
  type CitaMedicoDto,
  type ConsultaMedicoDto,
} from "../../lib/medicoApi";

interface Props {
  readonly citaId: number;
  readonly nombrePaciente?: string;
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

export function PantallaDetalleConsultaCompleta({
  citaId,
  nombrePaciente: nombreParam,
}: Props): React.JSX.Element {
  const [cita, setCita] = useState<CitaMedicoDto | null>(null);
  const [consulta, setConsulta] = useState<ConsultaMedicoDto | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (citaId < 1) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const data = await fetchHistorialDetalleMedicoAuthed(citaId);
      setCita(data.cita);
      setConsulta(data.consulta);
    } catch {
      setCita(null);
      setConsulta(null);
    } finally {
      setCargando(false);
    }
  }, [citaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (cargando) {
    return (
      <SafeAreaView style={estilos.area}>
        <View style={estilos.header}>
          <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
            <Ionicons name="chevron-back" size={24} color={paleta.white} />
          </TouchableOpacity>
          <Text style={estilos.tituloHeader}>DETALLE DE CONSULTA</Text>
        </View>
        <ActivityIndicator color={paleta.navy} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!cita) {
    return (
      <SafeAreaView style={estilos.area}>
        <View style={estilos.header}>
          <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
            <Ionicons name="chevron-back" size={24} color={paleta.white} />
          </TouchableOpacity>
          <Text style={estilos.tituloHeader}>DETALLE DE CONSULTA</Text>
        </View>
        <Text style={estilos.error}>No se encontró la consulta.</Text>
      </SafeAreaView>
    );
  }

  const ini = new Date(cita.inicio);
  const fin = new Date(cita.fin);
  const nombre =
    nombreParam?.trim() ||
    (cita.paciente ? nombrePaciente(cita.paciente) : "Paciente");

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={estilos.back}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader} numberOfLines={1}>
          DETALLE DE CONSULTA
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hero}>
          <Text style={estilos.heroNombre}>{nombre}</Text>
          <Text style={estilos.heroSub}>
            {cita.medico?.especialidad?.nombre ?? "Consulta médica"}
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
            value={`${ini.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} – ${fin.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
          />
          <CampoSoloLectura label="SUCURSAL" value={cita.sucursal?.nombre} />
          <CampoSoloLectura label="DIRECCIÓN" value={cita.sucursal?.direccion} />
          <CampoSoloLectura
            label="TOTAL CONSULTA"
            value={`$${Math.round(parseFloat(cita.montoTotal))} MXN`}
          />
        </SeccionFormulario>

        {consulta ? (
          <>
            <SeccionFormulario titulo="Identificación" icono="person-outline">
              <CampoSoloLectura
                label="ALERGIAS / IDENTIFICACIÓN"
                value={consulta.identificacion}
              />
              <CampoSoloLectura
                label="ANTECEDENTES"
                value={consulta.antecedentes}
              />
            </SeccionFormulario>

            <SeccionFormulario titulo="Consulta clínica" icono="medkit-outline">
              <CampoSoloLectura
                label="MOTIVO DE CONSULTA"
                value={consulta.interrogatorio}
              />
              <CampoSoloLectura
                label="EXPLORACIÓN FÍSICA"
                value={consulta.exploracionFisica}
              />
              {consulta.pesoKg != null && consulta.alturaM != null ? (
                <CampoSoloLectura
                  label="DATOS FÍSICOS"
                  value={`Peso: ${consulta.pesoKg} kg · Altura: ${consulta.alturaM} m`}
                />
              ) : null}
              <CampoSoloLectura
                label="DIAGNÓSTICO"
                value={consulta.diagnosticos}
              />
              <CampoSoloLectura
                label="TRATAMIENTO"
                value={consulta.tratamiento}
              />
              <CampoSoloLectura label="EVOLUCIÓN" value={consulta.evolucion} />
              <CampoSoloLectura label="PRONÓSTICO" value={consulta.pronostico} />
            </SeccionFormulario>

            {consulta.estudiosLaboratorio?.trim() ? (
              <SeccionFormulario titulo="Laboratorio" icono="flask-outline">
                <CampoSoloLectura
                  label="ESTUDIOS / RESULTADOS"
                  value={consulta.estudiosLaboratorio}
                />
              </SeccionFormulario>
            ) : null}

            {consulta.notasConfidenciales?.trim() ? (
              <SeccionFormulario
                titulo="Notas confidenciales"
                icono="lock-closed-outline"
              >
                <CampoSoloLectura
                  label="NOTAS"
                  value={consulta.notasConfidenciales}
                />
              </SeccionFormulario>
            ) : null}

            <SeccionFormulario titulo="Registro" icono="time-outline">
              <CampoSoloLectura
                label="FECHA DE REGISTRO"
                value={
                  consulta.fechaRegistro
                    ? new Date(consulta.fechaRegistro).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : null
                }
              />
            </SeccionFormulario>
          </>
        ) : (
          <View style={estilos.aviso}>
            <Ionicons
              name="document-text-outline"
              size={40}
              color={paleta.skyblue}
            />
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
    flex: 1,
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
    borderLeftColor: paleta.teal,
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
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  avisoTxt: {
    fontSize: 13,
    color: paleta.teal,
    textAlign: "center",
    lineHeight: 20,
  },
  error: { textAlign: "center", marginTop: 40, color: paleta.teal },
});
