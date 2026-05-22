import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { paleta, BORDES } from "../../constants/theme";
import {
  avanzarMes,
  diaEnRango,
  diasMatrizCalendario,
  esExtremoRango,
  etiquetasDiasSemana,
  inicioMes,
  mismoDia,
  tituloMes,
} from "./calendarioUtils";

export type ModoCalendarioMedly = "dia" | "rango";

export interface CalendarioMedlyProps {
  readonly mesVisible: Date;
  readonly onMesVisibleChange: (mes: Date) => void;
  readonly modo?: ModoCalendarioMedly;
  readonly fechaSeleccionada?: Date | null;
  readonly onSeleccionDia?: (fecha: Date) => void;
  readonly rangoInicio?: Date | null;
  readonly rangoFin?: Date | null;
  readonly onSeleccionRango?: (inicio: Date | null, fin: Date | null) => void;
  readonly diaHabilitado?: (fecha: Date) => boolean;
  readonly minDate?: Date;
  readonly maxDate?: Date;
}

export function CalendarioMedly({
  mesVisible,
  onMesVisibleChange,
  modo = "dia",
  fechaSeleccionada = null,
  onSeleccionDia,
  rangoInicio = null,
  rangoFin = null,
  onSeleccionRango,
  diaHabilitado,
  minDate,
  maxDate,
}: CalendarioMedlyProps): React.JSX.Element {
  const dias = useMemo(() => diasMatrizCalendario(mesVisible), [mesVisible]);
  const mesActual = mesVisible.getMonth();

  const tocarDia = (dia: Date): void => {
    if (minDate && dia < minDate) return;
    if (maxDate && dia > maxDate) return;
    if (diaHabilitado && !diaHabilitado(dia)) return;

    if (modo === "dia") {
      onSeleccionDia?.(dia);
      return;
    }

    if (!rangoInicio || (rangoInicio && rangoFin)) {
      onSeleccionRango?.(dia, null);
      return;
    }
    onSeleccionRango?.(rangoInicio, dia);
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabeceraMes}>
        <Pressable
          onPress={() => onMesVisibleChange(avanzarMes(mesVisible, -1))}
          style={estilos.flecha}
          accessibilityLabel="Mes anterior"
        >
          <Ionicons name="chevron-back" size={22} color={paleta.navy} />
        </Pressable>
        <Text style={estilos.tituloMes}>{tituloMes(mesVisible)}</Text>
        <Pressable
          onPress={() => onMesVisibleChange(avanzarMes(mesVisible, 1))}
          style={estilos.flecha}
          accessibilityLabel="Mes siguiente"
        >
          <Ionicons name="chevron-forward" size={22} color={paleta.navy} />
        </Pressable>
      </View>

      <View style={estilos.filaSemana}>
        {etiquetasDiasSemana().map((d) => (
          <Text key={d} style={estilos.labelSemana}>
            {d}
          </Text>
        ))}
      </View>

      <View style={estilos.rejilla}>
        {dias.map((dia) => {
          const fueraMes = dia.getMonth() !== mesActual;
          const selDia =
            modo === "dia" &&
            fechaSeleccionada != null &&
            mismoDia(dia, fechaSeleccionada);
          const enRango =
            modo === "rango" && diaEnRango(dia, rangoInicio, rangoFin);
          const extremo =
            modo === "rango" ? esExtremoRango(dia, rangoInicio, rangoFin) : null;
          const deshabilitado =
            (minDate != null && dia < minDate) ||
            (maxDate != null && dia > maxDate) ||
            (diaHabilitado != null && !diaHabilitado(dia));

          return (
            <Pressable
              key={dia.toISOString()}
              onPress={() => tocarDia(dia)}
              disabled={deshabilitado}
              style={[
                estilos.celda,
                enRango && estilos.celdaEnRango,
                extremo === "inicio" && estilos.celdaRangoInicio,
                extremo === "fin" && estilos.celdaRangoFin,
              ]}
            >
              <View
                style={[
                  estilos.celdaInner,
                  (selDia || extremo) && estilos.celdaInnerSel,
                ]}
              >
                <Text
                  style={[
                    estilos.numero,
                    fueraMes && estilos.numeroFueraMes,
                    deshabilitado && estilos.numeroDeshabilitado,
                    (selDia || enRango || extremo) && estilos.numeroSel,
                  ]}
                >
                  {dia.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  cabeceraMes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  flecha: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloMes: {
    fontSize: 16,
    fontWeight: "700",
    color: paleta.navy,
    textTransform: "capitalize",
  },
  filaSemana: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  labelSemana: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 0.3,
  },
  rejilla: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  celda: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
  },
  celdaEnRango: {
    backgroundColor: paleta.navy,
  },
  celdaRangoInicio: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  celdaRangoFin: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  celdaInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  celdaInnerSel: {
    backgroundColor: paleta.navy,
  },
  numero: {
    fontSize: 14,
    fontWeight: "600",
    color: paleta.navy,
  },
  numeroFueraMes: {
    color: "#B8C5CE",
  },
  numeroDeshabilitado: {
    color: "#D1D5DB",
  },
  numeroSel: {
    color: paleta.white,
    fontWeight: "800",
  },
});
