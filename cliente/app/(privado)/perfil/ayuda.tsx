import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";

const FAQ = [
  {
    q: "¿Cómo agendo una cita?",
    a: "En Inicio elige «Agendar cita» o el acceso rápido; selecciona especialidad, médico, sucursal, horario y completa el pago del anticipo.",
  },
  {
    q: "¿Dónde veo mis citas?",
    a: "En la pestaña «Agenda» aparecen todas tus citas; puedes abrir cada una para ver detalle o cancelar según políticas.",
  },
  {
    q: "¿Cómo cancelo y qué pasa con el anticipo?",
    a: "Si cancelas con más de 24 h de anticipo puede aplicarse reembolso del anticipo vía Stripe; dentro de 24 h no hay reembolso.",
  },
] as const;

export default function AyudaPantalla(): React.JSX.Element {
  const [q, setQ] = useState("");
  const filtro = q.trim().toLowerCase();
  const lista = FAQ.filter(
    (f) =>
      !filtro ||
      f.q.toLowerCase().includes(filtro) ||
      f.a.toLowerCase().includes(filtro),
  );

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.top}>
        <TouchableOpacity
          style={estilos.btnAtras}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>CENTRO DE AYUDA</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.buscador}>
          <Ionicons name="search-outline" size={20} color={paleta.teal} />
          <TextInput
            style={estilos.inputBuscador}
            placeholder="BUSCAR AYUDA"
            placeholderTextColor={paleta.teal}
            value={q}
            onChangeText={setQ}
          />
        </View>

        <Text style={estilos.sub}>PREGUNTAS FRECUENTES</Text>
        {lista.map((item) => (
          <View key={item.q} style={estilos.card}>
            <Text style={estilos.preg}>{item.q}</Text>
            <Text style={estilos.resp}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  btnAtras: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.8,
  },
  scroll: { padding: 24, paddingBottom: 48 },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    marginBottom: 22,
  },
  inputBuscador: { flex: 1, marginLeft: 10, fontSize: 14, color: paleta.navy },
  sub: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  preg: {
    fontSize: 15,
    fontWeight: "700",
    color: paleta.navy,
    marginBottom: 8,
  },
  resp: { fontSize: 14, color: paleta.teal, lineHeight: 20 },
});
