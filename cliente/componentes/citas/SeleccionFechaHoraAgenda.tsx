import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { CalendarioMedly } from "../calendario/CalendarioMedly";
import {
  claveDiaLocal,
  construirRejillaDia,
  fechasUnicasDesdeSlots,
  HORA_FIN_LABORAL,
  HORA_INICIO_LABORAL,
  INTERVALO_MINUTOS,
  type SlotDto,
} from "../../lib/agendaPickerUtils";
import { COLORES, paleta, BORDES } from "../../constants/theme";

interface SeleccionFechaHoraAgendaProps {
  readonly cargando: boolean;
  readonly slots: SlotDto[];
  readonly mesAgenda: Date;
  readonly onMesAgendaChange: (mes: Date) => void;
  readonly fechaSeleccionada: Date | null;
  readonly onFechaSeleccionada: (fecha: Date) => void;
  readonly slotSeleccionado: SlotDto | null;
  readonly onSlotSeleccionado: (slot: SlotDto | null, hora: string | null) => void;
}

export function SeleccionFechaHoraAgenda({
  cargando,
  slots,
  mesAgenda,
  onMesAgendaChange,
  fechaSeleccionada,
  onFechaSeleccionada,
  slotSeleccionado,
  onSlotSeleccionado,
}: SeleccionFechaHoraAgendaProps): React.JSX.Element {
  const diasConCupo = useMemo(() => fechasUnicasDesdeSlots(slots), [slots]);

  const diasConCupoSet = useMemo(() => {
    const set = new Set<string>();
    for (const d of diasConCupo) {
      set.add(claveDiaLocal(d));
    }
    return set;
  }, [diasConCupo]);

  const rejillaHorarios = useMemo(() => {
    if (fechaSeleccionada == null) return [];
    return construirRejillaDia(fechaSeleccionada, slots);
  }, [fechaSeleccionada, slots]);

  if (cargando) {
    return (
      <ActivityIndicator style={{ marginVertical: 24 }} color={paleta.navy} />
    );
  }

  if (slots.length === 0 || diasConCupo.length === 0) {
    return (
      <Text style={estilos.sinHorariosTxt}>
        No hay fechas disponibles. Prueba otro médico o sucursal.
      </Text>
    );
  }

  return (
    <>
      <Text style={estilos.tituloSeccion}>FECHA Y HORA</Text>
      <Text style={estilos.ayuda}>
        Horario de {HORA_INICIO_LABORAL}:00 a {HORA_FIN_LABORAL}:00 · cada{" "}
        {INTERVALO_MINUTOS} min (incluye sábado)
      </Text>

      <View style={estilos.calCard}>
        <CalendarioMedly
          mesVisible={mesAgenda}
          onMesVisibleChange={onMesAgendaChange}
          modo="dia"
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionDia={onFechaSeleccionada}
          diaHabilitado={(d) => diasConCupoSet.has(claveDiaLocal(d))}
          minDate={new Date()}
        />
      </View>

      <View style={estilos.leyendaFila}>
        <View style={estilos.leyendaItem}>
          <View style={[estilos.leyendaDot, { backgroundColor: paleta.teal }]} />
          <Text style={estilos.leyendaTxt}>Disponible</Text>
        </View>
        <View style={estilos.leyendaItem}>
          <View
            style={[estilos.leyendaDot, { backgroundColor: COLORES.peligro }]}
          />
          <Text style={estilos.leyendaTxt}>Ocupado</Text>
        </View>
      </View>

      {fechaSeleccionada != null && (
        <>
          <Text style={estilos.tituloHoras}>HORARIOS DISPONIBLES</Text>
          <View style={estilos.rejillaHoras}>
            {rejillaHorarios.map((celda) => {
              const sel =
                celda.disponible &&
                celda.slot != null &&
                slotSeleccionado?.slotID === celda.slot.slotID;
              if (!celda.disponible) {
                return (
                  <View
                    key={celda.hora}
                    style={[estilos.celdaHora, estilos.celdaHoraOcupada]}
                    accessibilityState={{ disabled: true }}
                  >
                    <Text style={estilos.celdaHoraTxtOcupada}>
                      {celda.etiqueta}
                    </Text>
                  </View>
                );
              }
              return (
                <Pressable
                  key={celda.hora}
                  onPress={() => {
                    if (celda.slot != null) {
                      onSlotSeleccionado(celda.slot, celda.hora);
                    }
                  }}
                  style={({ pressed }) => [
                    estilos.celdaHora,
                    estilos.celdaHoraLibre,
                    sel && estilos.celdaHoraSel,
                    pressed && !sel && estilos.celdaHoraPressed,
                  ]}
                >
                  <Text
                    style={[
                      estilos.celdaHoraTxt,
                      sel && estilos.celdaHoraTxtSel,
                    ]}
                  >
                    {celda.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  tituloSeccion: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  ayuda: {
    fontSize: 12,
    color: paleta.teal,
    marginBottom: 12,
    lineHeight: 18,
  },
  calCard: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 12,
  },
  leyendaFila: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaTxt: { fontSize: 12, fontWeight: "600", color: paleta.navy },
  tituloHoras: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  rejillaHoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  celdaHora: {
    width: "31%",
    minWidth: 96,
    borderRadius: BORDES.radio,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  celdaHoraLibre: {
    backgroundColor: paleta.white,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  celdaHoraSel: {
    backgroundColor: paleta.navy,
    borderColor: paleta.navy,
  },
  celdaHoraPressed: {
    backgroundColor: paleta.skyblue,
    borderColor: paleta.teal,
  },
  celdaHoraOcupada: {
    backgroundColor: "rgba(230, 57, 70, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(230, 57, 70, 0.45)",
    opacity: 0.85,
  },
  celdaHoraTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: paleta.navy,
    textAlign: "center",
  },
  celdaHoraTxtSel: { color: paleta.white },
  celdaHoraTxtOcupada: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORES.peligro,
    textAlign: "center",
  },
  sinHorariosTxt: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginVertical: 24,
    lineHeight: 20,
  },
});
