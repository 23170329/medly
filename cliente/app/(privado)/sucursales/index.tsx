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
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { fetchSucursales, type SucursalDto } from "../../../lib/medlyApi";
import { collageParaSucursal, nombreCortoSucursal } from "../../../constants/sucursalesVisuales";
import { GOOGLE_BUSINESS_SHARE_URL } from "../../../constants/mapas";
import { resolverListaSucursales } from "../../../constants/sucursalesCatalogo";

const ANCHO = Dimensions.get("window").width;
const PADDING = 20;
const ANCHO_CARD = ANCHO - PADDING * 2;
const ALTO_COLLAGE = Math.round(ANCHO_CARD * 0.52);
const ALTO_BANDA = Math.round(ANCHO_CARD * 0.28);
const ALTO_CARD = ALTO_COLLAGE + ALTO_BANDA;
const RADIO_CARD = 22;
const MARGEN_BANDA_H = 26;
const MARGEN_BANDA_V = 20;

function abrirGoogleBusiness(): void {
  Linking.openURL(GOOGLE_BUSINESS_SHARE_URL).catch(() =>
    Alert.alert(
      "No se pudo abrir",
      "Abre Google Maps o el navegador para ver el perfil de Medly.",
    ),
  );
}

function TarjetaSucursal({ s }: { readonly s: SucursalDto }): React.JSX.Element {
  const imgs = collageParaSucursal(s);
  const etiqueta = nombreCortoSucursal(s.nombre);

  return (
    <View style={estilos.cardWrap}>
      <View style={estilos.collage}>
        <Image source={imgs.principal} style={estilos.imgPrincipal} resizeMode="cover" />
        <View style={estilos.colDerecha}>
          <Image
            source={imgs.secundariaArriba}
            style={estilos.imgSecundaria}
            resizeMode="cover"
          />
          <Image
            source={imgs.secundariaAbajo}
            style={[estilos.imgSecundaria, estilos.imgSecundariaAbajo]}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={estilos.bandaInfo}>
        <View style={estilos.bandaIzquierda}>
          <Text style={estilos.cardLabel}>Sucursal</Text>
          <Text style={estilos.cardNombre}>{etiqueta}</Text>
        </View>
        <View style={estilos.bandaDerecha}>
          <TouchableOpacity
            style={estilos.btnGoogleCard}
            onPress={abrirGoogleBusiness}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${etiqueta} en Google Business`}
          >
            <Ionicons name="logo-google" size={15} color={paleta.white} />
            <Text style={estilos.btnGoogleCardTxt}>Google</Text>
          </TouchableOpacity>
          <Text style={estilos.cardMarca}>Medly</Text>
        </View>
      </View>
    </View>
  );
}

export default function SucursalesPantalla(): React.JSX.Element {
  const [lista, setLista] = useState<SucursalDto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchSucursales();
      setLista(resolverListaSucursales(data));
    } catch (e) {
      console.warn("fetchSucursales:", e);
      setLista(resolverListaSucursales([]));
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={estilos.back}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
        >
          <Ionicons name="chevron-back" size={22} color={paleta.navy} />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>SUCURSALES</Text>
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
              Desliza hacia abajo para reintentar.
            </Text>
            <TouchableOpacity
              style={estilos.btnGoogleVacio}
              onPress={abrirGoogleBusiness}
            >
              <Ionicons name="logo-google" size={18} color={paleta.white} />
              <Text style={estilos.btnGoogleVacioTxt}>Ver en Google</Text>
            </TouchableOpacity>
          </View>
        ) : (
          lista.map((s) => <TarjetaSucursal key={s.sucursalID} s={s} />)
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: paleta.navy,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tituloHeader: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 1.5,
  },
  scroll: {
    paddingHorizontal: PADDING,
    paddingBottom: 32,
    gap: 24,
  },
  cardWrap: {
    width: ANCHO_CARD,
    height: ALTO_CARD,
    borderRadius: RADIO_CARD,
    overflow: "hidden",
    backgroundColor: paleta.navy,
    shadowColor: paleta.navy,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  collage: {
    flexDirection: "row",
    height: ALTO_COLLAGE,
    gap: 3,
    padding: 3,
    paddingBottom: 0,
  },
  imgPrincipal: {
    flex: 1.55,
    height: "100%",
    borderTopLeftRadius: RADIO_CARD - 4,
    borderBottomLeftRadius: 4,
  },
  colDerecha: {
    flex: 1,
    gap: 3,
  },
  imgSecundaria: {
    flex: 1,
    width: "100%",
    borderTopRightRadius: 4,
  },
  imgSecundariaAbajo: {
    borderBottomRightRadius: RADIO_CARD - 4,
  },
  bandaInfo: {
    height: ALTO_BANDA,
    backgroundColor: paleta.navy,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingLeft: MARGEN_BANDA_H,
    paddingRight: MARGEN_BANDA_H,
    paddingTop: MARGEN_BANDA_V,
    paddingBottom: MARGEN_BANDA_V,
    borderBottomLeftRadius: RADIO_CARD,
    borderBottomRightRadius: RADIO_CARD,
  },
  bandaIzquierda: {
    flex: 1,
    justifyContent: "flex-end",
    paddingRight: 12,
    minWidth: 0,
  },
  bandaDerecha: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: 12,
    paddingBottom: 2,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardNombre: {
    fontSize: 34,
    fontWeight: "800",
    color: paleta.white,
    letterSpacing: 0.4,
    lineHeight: 38,
  },
  cardMarca: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
  },
  btnGoogleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: paleta.teal,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BORDES.radioPill,
  },
  btnGoogleCardTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: paleta.white,
    letterSpacing: 0.3,
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
  btnGoogleVacio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: paleta.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BORDES.radioPill,
  },
  btnGoogleVacioTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.white,
  },
});
