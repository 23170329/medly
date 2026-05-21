import React from "react";
import { Stack } from "expo-router";
import { useGuardRol } from "../../hooks/useGuardRol";

export default function MedicoLayout(): React.JSX.Element {
  useGuardRol(["MEDICO"]);
  return <Stack screenOptions={{ headerShown: false }} />;
}
