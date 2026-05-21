import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { COLORES, paleta } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import { redirigirTrasSplash } from "../../lib/rutasAuth";

export default function SplashPantalla(): React.JSX.Element {
  const cargarSesion = useAuthStore((s) => s.cargarSesion);

  useEffect(() => {
    let cancel = false;
    const run = async (): Promise<void> => {
      await cargarSesion();
      await new Promise((r) => setTimeout(r, 1800));
      if (cancel) return;
      const tok = useAuthStore.getState().accessToken;
      const usuario = useAuthStore.getState().usuario;
      redirigirTrasSplash(usuario, Boolean(tok));
    };
    void run();
    return () => {
      cancel = true;
    };
  }, [cargarSesion]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.circulo}>
        <Image
          source={require("../../assets/logo-medly-oficial.png")}
          style={estilos.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={estilos.marca}>MEDLY CORPORATION</Text>
      <ActivityIndicator
        style={{ marginTop: 28 }}
        color={paleta.teal}
        size="small"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  circulo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    shadowColor: paleta.navy,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },
  marca: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
    color: paleta.teal,
    textAlign: "center",
  },
});
