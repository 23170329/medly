import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { fetchSucursales, type SucursalDto } from "../../../lib/medlyApi";

export default function SucursalesPantalla(): React.JSX.Element {
  const [lista, setLista] = useState<SucursalDto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchSucursales();
      setLista(data);
    } catch {
      setLista([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>SUCURSALES</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
        }
      >
        {cargando && lista.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={paleta.navy} />
        ) : (
          lista.map((s) => (
            <View key={s.sucursalID} style={estilos.card}>
              <View style={estilos.iconWrap}>
                <Ionicons name="business" size={28} color={paleta.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>{s.nombre}</Text>
                <Text style={estilos.dir}>{s.direccion}</Text>
                <View style={estilos.telRow}>
                  <Ionicons name="call-outline" size={14} color={paleta.teal} />
                  <Text style={estilos.tel}>{s.telefono}</Text>
                </View>
                <Text style={estilos.cap}>
                  Consultorios: {s.capacidadConsultorios}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 1,
  },
  scroll: { padding: 24, paddingBottom: 48 },
  card: {
    flexDirection: "row",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 14,
    gap: 14,
    elevation: 2,
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BORDES.radio,
    backgroundColor: paleta.skyblue,
    justifyContent: "center",
    alignItems: "center",
  },
  nombre: { fontSize: 16, fontWeight: "700", color: paleta.navy },
  dir: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  telRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  tel: { fontSize: 13, color: paleta.navy },
  cap: { fontSize: 12, color: paleta.teal, marginTop: 6 },
});
