import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { paleta, BORDES } from "../../constants/theme";

interface EncabezadoPacienteProps {
  readonly nombreCorto: string;
  readonly inicial: string;
  readonly onPerfil: () => void;
  readonly onNotificaciones?: () => void;
  readonly notificacionesNoLeidas?: number;
}

export function EncabezadoPaciente({
  nombreCorto,
  inicial,
  onPerfil,
  onNotificaciones,
  notificacionesNoLeidas = 0,
}: EncabezadoPacienteProps): React.JSX.Element {
  return (
    <View style={estilos.fondo} accessibilityRole="header">
      <View style={estilos.fila}>
        <TouchableOpacity
          onPress={onPerfil}
          style={estilos.avatar}
          accessibilityLabel="Mi perfil"
          accessibilityRole="button"
        >
          <Text style={estilos.avatarTxt}>{inicial}</Text>
        </TouchableOpacity>
        <View style={estilos.textos}>
          <Text style={estilos.hola}>Hola,</Text>
          <Text style={estilos.nombre} numberOfLines={1}>
            {nombreCorto}
          </Text>
        </View>
        <TouchableOpacity
          style={estilos.campana}
          onPress={onNotificaciones ?? (() => {})}
          accessibilityLabel="Notificaciones"
          accessibilityRole="button"
        >
          <Ionicons name="notifications-outline" size={22} color={paleta.white} />
          {notificacionesNoLeidas > 0 && (
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>
                {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    backgroundColor: paleta.headerBar,
    borderBottomLeftRadius: BORDES.radio + 8,
    borderBottomRightRadius: BORDES.radio + 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    marginBottom: 20,
    shadowColor: paleta.navy,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarTxt: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.white,
  },
  textos: { flex: 1, minWidth: 0 },
  hola: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  nombre: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.white,
    marginTop: 2,
  },
  campana: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: paleta.red,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: paleta.white,
  },
});
