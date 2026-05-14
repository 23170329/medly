import "react-native-gesture-handler";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AppTheme } from "../constants/theme";
import { useAuthStore } from "../stores/auth.store";

export default function RootLayout() {
  const cargarSesion = useAuthStore((s) => s.cargarSesion);

  useEffect(() => {
    void cargarSesion();
  }, [cargarSesion]);

  return (
    <PaperProvider theme={AppTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
