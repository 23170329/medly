import { Stack } from "expo-router";
import { paleta } from "../../constants/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: paleta.beige },
        animation: "slide_from_right",
      }}
    />
  );
}
