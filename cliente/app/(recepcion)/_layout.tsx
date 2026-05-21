import React from "react";
import { Stack } from "expo-router";
import { useGuardRol } from "../../hooks/useGuardRol";

export default function RecepcionLayout(): React.JSX.Element {
  useGuardRol(["RECEPCIONISTA"]);
  return <Stack screenOptions={{ headerShown: false }} />;
}
