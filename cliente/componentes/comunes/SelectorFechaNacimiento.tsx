import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { CalendarioMedly } from "../calendario/CalendarioMedly";
import { Entrada } from "./Entrada";
import { COLORES, paleta, BORDES } from "../../constants/theme";

interface SelectorFechaNacimientoProps {
  readonly etiqueta?: string;
  readonly value: string;
  readonly onChange: (ddMmYyyy: string) => void;
  readonly mensajeError?: string;
}

export function SelectorFechaNacimiento({
  etiqueta = "NACIMIENTO",
  value,
  onChange,
  mensajeError,
}: SelectorFechaNacimientoProps): React.JSX.Element {
  const [mostrar, setMostrar] = useState(false);
  const [fecha, setFecha] = useState(() => new Date());
  const [mesVisible, setMesVisible] = useState(() => new Date());

  const aplicar = (f: Date): void => {
    setFecha(f);
    const dia = String(f.getDate()).padStart(2, "0");
    const mes = String(f.getMonth() + 1).padStart(2, "0");
    const anio = f.getFullYear();
    onChange(`${dia}/${mes}/${anio}`);
    setMostrar(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setMostrar(true)} activeOpacity={0.8}>
        <View pointerEvents="none">
          <Entrada
            etiqueta={etiqueta}
            placeholder="DD/MM/AAAA"
            icono="calendar-outline"
            value={value}
            editable={false}
            mensajeError={mensajeError}
          />
        </View>
      </TouchableOpacity>
      <Modal visible={mostrar} transparent animationType="fade">
        <View style={estilos.overlay}>
          <View style={estilos.card}>
            <Text style={estilos.tituloModal}>Fecha de nacimiento</Text>
            <CalendarioMedly
              mesVisible={mesVisible}
              onMesVisibleChange={setMesVisible}
              modo="dia"
              fechaSeleccionada={fecha}
              onSeleccionDia={aplicar}
              maxDate={new Date()}
            />
            <TouchableOpacity
              style={estilos.cerrar}
              onPress={() => setMostrar(false)}
            >
              <Text style={estilos.cerrarTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
  },
  tituloModal: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.navy,
    marginBottom: 12,
    textAlign: "center",
  },
  cerrar: { marginTop: 12, alignItems: "center", paddingVertical: 10 },
  cerrarTxt: { fontWeight: "700", color: paleta.teal },
});
