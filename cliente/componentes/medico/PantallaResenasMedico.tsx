import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import {
  fetchResenasMedicoAuthed,
  nombrePaciente,
  type ResenaMedicoDto,
} from "../../lib/medicoApi";

function Estrellas({ cantidad }: { cantidad: number }): React.JSX.Element {
  return (
    <View style={estilos.estrellas}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= cantidad ? "star" : "star-outline"}
          size={18}
          color="#F5B301"
        />
      ))}
    </View>
  );
}

function TarjetaResena({ item }: { item: ResenaMedicoDto }): React.JSX.Element {
  const nombre = item.paciente
    ? nombrePaciente(item.paciente)
    : `Paciente #${item.pacienteID}`;
  const comentario =
    item.comentario?.trim() || "Sin comentario escrito.";
  const fecha = new Date(item.fechaCalificacion).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.tarjetaHeader}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTxt}>
            {nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombre}>{nombre}</Text>
          <Estrellas cantidad={item.estrellas} />
        </View>
        <Text style={estilos.fecha}>{fecha}</Text>
      </View>
      <Text style={estilos.comentario}>{comentario}</Text>
    </View>
  );
}

export function PantallaResenasMedico(): React.JSX.Element {
  const [lista, setLista] = useState<ResenaMedicoDto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchResenasMedicoAuthed();
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={estilos.back}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>MIS RESEÑAS</Text>
      </View>

      {cargando && lista.length === 0 ? (
        <ActivityIndicator color={paleta.navy} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => String(item.calificacionID)}
          renderItem={({ item }) => <TarjetaResena item={item} />}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
          }
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <Ionicons name="star-outline" size={56} color={paleta.skyblue} />
              <Text style={estilos.vacioTitulo}>Sin reseñas aún</Text>
              <Text style={estilos.vacioSub}>
                Cuando tus pacientes califiquen una consulta completada,
                aparecerán aquí.
              </Text>
            </View>
          }
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
  tituloHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 0.5,
  },
  lista: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },
  tarjeta: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 16, fontWeight: "800", color: paleta.navy },
  nombre: {
    fontSize: 15,
    fontWeight: "800",
    color: paleta.navy,
    marginBottom: 4,
  },
  estrellas: { flexDirection: "row", gap: 2 },
  fecha: { fontSize: 11, color: paleta.teal, fontWeight: "600" },
  comentario: {
    fontSize: 14,
    color: paleta.navy,
    lineHeight: 20,
  },
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
