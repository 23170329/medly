import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";

export interface ResenaDoctorUi {
  id: string;
  nombrePaciente: string;
  calificacion: number; // 1..5
  comentario: string;
  fecha: string;
}

function Estrellas({ n }: { n: number }): React.JSX.Element {
  return (
    <View style={estilos.estrellas}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= n ? "star" : "star-outline"}
          size={18}
          color="#F5B301"
        />
      ))}
    </View>
  );
}

export function PantallaResenasDoctor({
  medicoId,
  nombreDoctor,
}: {
  medicoId: number;
  nombreDoctor?: string;
}): React.JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [resenas, setResenas] = useState<ResenaDoctorUi[]>([]);

  const titulo = useMemo(() => {
    const n = (nombreDoctor ?? "").trim();
    return n ? `Reseñas de ${n}` : "Reseñas del Doctor";
  }, [nombreDoctor]);

  useEffect(() => {
    let cancel = false;
    setCargando(true);

    // Mock inicial: reemplazar por fetch real cuando exista el endpoint público.
    const timer = setTimeout(() => {
      if (cancel) return;
      setResenas([
        {
          id: "1",
          nombrePaciente: "Ana P.",
          calificacion: 5,
          comentario: "Excelente atención, muy claro y amable.",
          fecha: "27 may 2026",
        },
        {
          id: "2",
          nombrePaciente: "Luis C.",
          calificacion: 4,
          comentario: "Todo bien, solo un poco de espera.",
          fecha: "25 may 2026",
        },
      ]);
      setCargando(false);
    }, 700);

    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [medicoId]);

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.header}>
        <TouchableOpacity onPress={() => router.back()} style={estilos.back}>
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={paleta.navy} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={resenas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          renderItem={({ item }) => (
            <View style={estilos.card}>
              <View style={estilos.cardHeader}>
                <Text style={estilos.paciente}>{item.nombrePaciente}</Text>
                <Text style={estilos.fecha}>{item.fecha}</Text>
              </View>
              <Estrellas n={item.calificacion} />
              <Text style={estilos.comentario}>{item.comentario}</Text>
            </View>
          )}
        />
      )}
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
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 0.3,
  },
  lista: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  paciente: { fontSize: 15, fontWeight: "800", color: paleta.navy },
  fecha: { fontSize: 11, fontWeight: "600", color: paleta.teal, opacity: 0.8 },
  estrellas: { flexDirection: "row", gap: 2, marginBottom: 10 },
  comentario: { fontSize: 14, color: paleta.navy, lineHeight: 20 },
});

