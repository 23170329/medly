import React, { useCallback, useMemo, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import {
  fetchResenasDoctor,
  type ResenaDoctorDto,
} from "../../lib/medlyApi";

export interface ResenaDoctorUi {
  id: string;
  nombrePaciente: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

function nombrePacienteAbreviado(
  p?: ResenaDoctorDto["paciente"],
): string {
  if (!p) return "Paciente";
  const primer = (p.nombre ?? "").trim().split(/\s+/)[0] || "Paciente";
  const inicial = (p.apellido_pat ?? "").trim().charAt(0).toUpperCase();
  return inicial ? `${primer} ${inicial}.` : primer;
}

function aUi(item: ResenaDoctorDto): ResenaDoctorUi {
  const fecha = new Date(item.fechaCalificacion).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return {
    id: String(item.calificacionID),
    nombrePaciente: nombrePacienteAbreviado(item.paciente),
    calificacion: item.estrellas,
    comentario: item.comentario?.trim() || "Sin comentario escrito.",
    fecha,
  };
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

  const cargar = useCallback(async () => {
    if (!medicoId) {
      setResenas([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const data = await fetchResenasDoctor(medicoId);
      setResenas(data.map(aUi));
    } catch {
      setResenas([]);
    } finally {
      setCargando(false);
    }
  }, [medicoId]);

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
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      {cargando && resenas.length === 0 ? (
        <ActivityIndicator color={paleta.navy} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={resenas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <Ionicons name="star-outline" size={56} color={paleta.skyblue} />
              <Text style={estilos.vacioTitulo}>Sin reseñas aún</Text>
              <Text style={estilos.vacioSub}>
                Este médico aún no tiene calificaciones de pacientes.
              </Text>
            </View>
          }
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
  lista: { padding: 20, paddingBottom: 40, flexGrow: 1 },
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
  vacio: {
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 32,
  },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 16,
    textAlign: "center",
  },
  vacioSub: {
    fontSize: 14,
    color: paleta.teal,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
