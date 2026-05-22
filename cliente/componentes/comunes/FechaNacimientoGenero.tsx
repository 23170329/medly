import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Entrada } from "./Entrada";
import { COLORES, paleta, BORDES } from "../../constants/theme";

/**
 * NACIMIENTO + GÉNERO con DateTimePicker nativo (UIDatePicker en iOS).
 */
interface FechaNacimientoGeneroProps {
  readonly fechaNacimiento: string;
  readonly onFechaNacimientoChange: (ddMmYyyy: string) => void;
  readonly genero: string;
  readonly onGeneroChange: (g: "H" | "M") => void;
  readonly errorFecha?: string;
  readonly errorGenero?: string;
  readonly onFechaSeleccionada?: () => void;
}

function formatearDdMmYyyy(f: Date): string {
  const dia = f.getDate().toString().padStart(2, "0");
  const mes = (f.getMonth() + 1).toString().padStart(2, "0");
  const anio = f.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function parsearDdMmYyyy(valor: string): Date | null {
  const partes = valor.trim().split("/");
  if (partes.length !== 3) return null;
  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const anio = Number(partes[2]);
  if (!dia || !mes || !anio) return null;
  const d = new Date(anio, mes - 1, dia, 12, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function FechaNacimientoGenero({
  fechaNacimiento,
  onFechaNacimientoChange,
  genero,
  onGeneroChange,
  errorFecha,
  errorGenero,
  onFechaSeleccionada,
}: FechaNacimientoGeneroProps): React.JSX.Element {
  const [fecha, setFecha] = useState(() => new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const abrirCalendario = (): void => {
    const previa = parsearDdMmYyyy(fechaNacimiento);
    if (previa) setFecha(previa);
    setMostrarCalendario(true);
  };

  const aplicarFecha = (f: Date): void => {
    setFecha(f);
    onFechaNacimientoChange(formatearDdMmYyyy(f));
    onFechaSeleccionada?.();
    setMostrarCalendario(false);
  };

  const seleccionarFecha = (
    event: { type: string },
    fechaSeleccionada?: Date,
  ): void => {
    if (Platform.OS === "android") {
      setMostrarCalendario(false);
      if (event.type === "dismissed") return;
      if (fechaSeleccionada) aplicarFecha(fechaSeleccionada);
      return;
    }
    if (fechaSeleccionada) setFecha(fechaSeleccionada);
  };

  const modalIos =
    mostrarCalendario && Platform.OS === "ios" ? (
      <Modal
        visible
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMostrarCalendario(false)}
      >
        <View style={estilos.iosOverlay}>
          <View style={estilos.iosSheet}>
            <View style={estilos.iosBarra}>
              <TouchableOpacity onPress={() => setMostrarCalendario(false)}>
                <Text style={estilos.iosCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => aplicarFecha(fecha)}>
                <Text style={estilos.iosListo}>Listo</Text>
              </TouchableOpacity>
            </View>
            <View style={estilos.iosPickerWrap}>
              <DateTimePicker
                value={fecha}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={seleccionarFecha}
                locale="es-MX"
                themeVariant="light"
                textColor={paleta.navy}
                style={estilos.iosPicker}
              />
            </View>
          </View>
        </View>
      </Modal>
    ) : null;

  return (
    <>
      <View style={estilos.fila}>
        <View style={estilos.colNacimiento}>
          <TouchableOpacity onPress={abrirCalendario} activeOpacity={0.8}>
            <View pointerEvents="none">
              <Entrada
                etiqueta="NACIMIENTO"
                placeholder="AAAA/MM/DD"
                icono="calendar-outline"
                value={fechaNacimiento}
                editable={false}
                onChangeText={onFechaNacimientoChange}
                mensajeError={errorFecha}
              />
            </View>
          </TouchableOpacity>

          {mostrarCalendario && Platform.OS === "android" && (
            <DateTimePicker
              value={fecha}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={seleccionarFecha}
            />
          )}
        </View>
        <View style={estilos.colGenero}>
          <Text style={estilos.etiqueta}>GÉNERO</Text>
          <View style={estilos.contenedorGenero}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                estilos.tarjetaGenero,
                genero === "H" && estilos.tarjetaGeneroActiva,
              ]}
              onPress={() => onGeneroChange("H")}
              accessibilityRole="button"
              accessibilityLabel="Hombre"
              accessibilityState={{ selected: genero === "H" }}
            >
              <Text
                style={[
                  estilos.generoLetra,
                  genero === "H" && estilos.generoLetraActiva,
                ]}
              >
                H
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                estilos.tarjetaGenero,
                genero === "M" && estilos.tarjetaGeneroActiva,
              ]}
              onPress={() => onGeneroChange("M")}
              accessibilityRole="button"
              accessibilityLabel="Mujer"
              accessibilityState={{ selected: genero === "M" }}
            >
              <Text
                style={[
                  estilos.generoLetra,
                  genero === "M" && estilos.generoLetraActiva,
                ]}
              >
                M
              </Text>
            </TouchableOpacity>
          </View>
          {errorGenero != null && (
            <Text style={estilos.errorTexto}>{errorGenero}</Text>
          )}
        </View>
      </View>
      {modalIos}
    </>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  colNacimiento: {
    flex: 1,
    marginRight: 10,
  },
  colGenero: {
    flex: 1,
    marginLeft: 10,
  },
  etiqueta: {
    fontSize: 12,
    color: COLORES.texto,
    marginBottom: 8,
    fontWeight: "600",
  },
  contenedorGenero: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  tarjetaGenero: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: BORDES.radio,
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaGeneroActiva: {
    backgroundColor: COLORES.primario,
    borderColor: COLORES.primario,
  },
  generoLetra: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: COLORES.textoPlaceholder,
  },
  generoLetraActiva: {
    color: COLORES.blanco,
  },
  errorTexto: {
    fontSize: 12,
    color: COLORES.peligro,
    marginTop: 4,
  },
  iosOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  iosSheet: {
    backgroundColor: COLORES.blanco,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  iosBarra: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisClaro,
    backgroundColor: COLORES.blanco,
  },
  iosCancelar: {
    fontSize: 16,
    color: COLORES.textoMuted,
  },
  iosListo: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORES.primario,
  },
  iosPickerWrap: {
    width: "100%",
    backgroundColor: COLORES.blanco,
    alignItems: "center",
    paddingVertical: 8,
    paddingBottom: 28,
  },
  iosPicker: {
    width: "100%",
    height: 220,
    backgroundColor: COLORES.blanco,
  },
});
