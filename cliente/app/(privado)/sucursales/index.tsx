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
  Linking,
  Alert,
  ImageBackground,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { fetchSucursales, type SucursalDto } from "../../../lib/medlyApi";
import { imagenParaSucursal } from "../../../constants/sucursalesVisuales";
import { MAPA_MEDLY_URL } from "../../../constants/mapas";

const ANCHO = Dimensions.get("window").width;
const ALTO_CARD = Math.round(ANCHO * 0.72);

function abrirMapa(s: SucursalDto): void {
  if (s.latitud != null && s.longitud != null) {
    const url = `https://www.google.com/maps?q=${s.latitud},${s.longitud}`;
    Linking.openURL(url).catch(() => abrirMapaCompartido());
    return;
  }
  abrirMapaCompartido();
}

function abrirMapaCompartido(): void {
  Linking.openURL(MAPA_MEDLY_URL).catch(() =>
    Alert.alert("Error", "No se pudo abrir el mapa."),
  );
}

function nombreCorto(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return partes.length > 1 ? partes[partes.length - 1] : nombre;
}

export default function SucursalesPantalla(): React.JSX.Element {
  const [lista, setLista] = useState<SucursalDto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchSucursales();
      setLista(data);
    } catch (e) {
      console.warn("fetchSucursales:", e);
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
        <Text style={estilos.tituloHeader}>SUCURSALES</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
        }
      >
        {cargando && lista.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={paleta.navy} />
        ) : lista.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons name="business-outline" size={48} color={paleta.teal} />
            <Text style={estilos.vacioTitulo}>Sin sucursales activas</Text>
            <Text style={estilos.vacioTxt}>
              No pudimos cargar el listado. Desliza hacia abajo para reintentar.
            </Text>
            <TouchableOpacity
              style={estilos.btnMapaGeneral}
              onPress={abrirMapaCompartido}
            >
              <Ionicons name="location" size={18} color={paleta.white} />
              <Text style={estilos.btnMapaGeneralTxt}>Ver ubicación en Maps</Text>
            </TouchableOpacity>
          </View>
        ) : (
          lista.map((s) => (
            <TouchableOpacity
              key={s.sucursalID}
              activeOpacity={0.92}
              onPress={() => abrirMapa(s)}
              style={estilos.cardWrap}
              accessibilityRole="button"
              accessibilityLabel={`${s.nombre}, ver ubicación`}
            >
              <ImageBackground
                source={imagenParaSucursal(s.sucursalID)}
                style={estilos.cardImg}
                imageStyle={estilos.cardImgRadius}
                resizeMode="cover"
              >
                <View style={estilos.cardOverlay}>
                  <View>
                    <Text style={estilos.cardLabel}>Sucursal</Text>
                    <Text style={estilos.cardNombre}>
                      {nombreCorto(s.nombre)}
                    </Text>
                    <Text style={estilos.cardDir} numberOfLines={2}>
                      {s.direccion}
                    </Text>
                  </View>
                  <View style={estilos.cardPie}>
                    <Text style={estilos.cardMarca}>Medly</Text>
                    <View style={estilos.btnMapaChip}>
                      <Ionicons name="location" size={14} color={paleta.white} />
                      <Text style={estilos.btnMapaChipTxt}>Ubicación</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: paleta.headerBar,
    borderBottomLeftRadius: BORDES.radio + 6,
    borderBottomRightRadius: BORDES.radio + 6,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  tituloHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: paleta.white,
    letterSpacing: 1.2,
  },
  scroll: { padding: 20, paddingBottom: 40, gap: 20 },
  cardWrap: {
    borderRadius: BORDES.radio + 10,
    overflow: "hidden",
    shadowColor: paleta.navy,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardImg: {
    width: "100%",
    height: ALTO_CARD,
    justifyContent: "flex-end",
  },
  cardImgRadius: {
    borderRadius: BORDES.radio + 10,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    backgroundColor: "rgba(47, 65, 86, 0.55)",
    borderBottomLeftRadius: BORDES.radio + 10,
    borderBottomRightRadius: BORDES.radio + 10,
  },
  cardLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  cardNombre: {
    fontSize: 32,
    fontWeight: "800",
    color: paleta.white,
    letterSpacing: 0.5,
  },
  cardDir: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    maxWidth: "85%",
  },
  cardPie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  cardMarca: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  btnMapaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: paleta.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDES.radioPill,
  },
  btnMapaChipTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: paleta.white,
  },
  vacio: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
  },
  vacioTxt: {
    fontSize: 14,
    color: COLORES.textoMuted,
    textAlign: "center",
  },
  btnMapaGeneral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: paleta.teal,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: BORDES.radioPill,
  },
  btnMapaGeneralTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.white,
  },
});
