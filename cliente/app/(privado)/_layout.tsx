import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { paleta } from "../../constants/theme";
import { useGuardRol } from "../../hooks/useGuardRol";

interface TabIconProps {
  readonly name: React.ComponentProps<typeof Ionicons>["name"];
  readonly focused: boolean;
  readonly size: number;
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function TabIcon({ name, focused, size }: TabIconProps): React.JSX.Element {
  return (
    <View style={[estilos.iconoWrap, focused && estilos.iconoWrapActivo]}>
      <Ionicons
        name={name}
        size={size}
        color={focused ? paleta.navy : paleta.teal}
      />
    </View>
  );
}

export default function PrivadoLayout(): React.JSX.Element {
  useGuardRol(["PACIENTE", "ADMIN"]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: estilos.tabBar,
        tabBarActiveTintColor: paleta.navy,
        tabBarInactiveTintColor: paleta.teal,
        tabBarLabelStyle: estilos.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      {/* */}
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
              size={size}
            />
          ),
        }}
      />

      {/* */}
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "calendar" : "calendar-outline"}
              focused={focused}
              size={size}
            />
          ),
        }}
      />

      {/* */}
      <Tabs.Screen
        name="sucursales"
        options={{
          title: "Sucursales",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "location" : "location-outline"}
              focused={focused}
              size={size}
            />
          ),
        }}
      />

      {/* */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
              size={size}
            />
          ),
        }}
      />

      {/* */}
      <Tabs.Screen name="citas/[id]" options={{ href: null }} />
      <Tabs.Screen name="citas/agendar" options={{ href: null }} />
      <Tabs.Screen name="calificar/[citaId]" options={{ href: null }} />
      <Tabs.Screen name="notificaciones/index" options={{ href: null }} />
      <Tabs.Screen name="historial/index" options={{ href: null }} />
      <Tabs.Screen name="historial/[id]" options={{ href: null }} />
      <Tabs.Screen name="diagnostico/index" options={{ href: null }} />
      <Tabs.Screen name="laboratorio/index" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  tabBar: {
    backgroundColor: paleta.white,
    borderTopColor: paleta.skyblue,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: paleta.navy,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  iconoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconoWrapActivo: {
    backgroundColor: paleta.skyblue,
  },
});
