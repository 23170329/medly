import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { COLORES } from "../../constants/theme";
import { PerfilContenido } from "../../componentes/perfil/PerfilContenido";

export default function MedicoPerfil(): React.JSX.Element {
  return (
    <SafeAreaView style={estilos.area}>
      <PerfilContenido />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
});
