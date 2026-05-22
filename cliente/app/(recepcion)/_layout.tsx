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

export default function RecepcionLayout(): React.JSX.Element {
  useGuardRol(["RECEPCIONISTA"]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: estilos.tabBar,
        tabBarActiveTintColor: paleta.navy,
        tabBarInactiveTintColor: paleta.teal,
        tabBarLabelStyle: estilos.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
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
      <Tabs.Screen name="registrar-paciente" options={{ href: null }} />
      <Tabs.Screen name="citas/agendar" options={{ href: null }} />
      <Tabs.Screen name="citas/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="citas/[id]/llamar" options={{ href: null }} />
      <Tabs.Screen name="citas/pendiente" options={{ href: null }} />
      <Tabs.Screen name="citas/confirmada" options={{ href: null }} />
      <Tabs.Screen name="citas/exito" options={{ href: null }} />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  tabBar: {
    backgroundColor: paleta.white,
    borderTopColor: paleta.skyblue,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
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
