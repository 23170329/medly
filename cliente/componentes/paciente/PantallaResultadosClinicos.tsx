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
import {
  fetchResultadosPaciente,
  type ResultadoClinicoDto,
} from "../../../lib/medlyApi";

interface Props {
  readonly titulo: string;
  readonly tipo: "diagnostico" | "laboratorio";
  readonly vacioTitulo: string;
  readonly vacioSub: string;
  readonly iconoVacio: React.ComponentProps<typeof Ionicons>["name"];
}

function nombreMedico(
  m?: ResultadoClinicoDto["medico"],
): string {
  if (!m) return "Médico";
  return `${m.nombre} ${m.apellidoPat}`.trim();
}

function textoResultado(item: ResultadoClinicoDto, tipo: Props["tipo"]): string {
  if (tipo === "laboratorio") {
    return item.estudiosLaboratorio?.trim() || "Sin detalle";
  }
  return item.diagnosticos?.trim() || "Sin detalle";
}

export function PantallaResultadosClinicos({
  titulo,
  tipo,
  vacioTitulo,
  vacioSub,
  iconoVacio,
}: Props): React.JSX.Element {
  const [lista, setLista] = useState<ResultadoClinicoDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchResultadosPaciente(tipo);
      setLista(data);
    } catch {
      setLista([]);
    } finally {
      setCargando(false);
    }
  }, [tipo]);

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
        <Text style={estilos.titulo}>{titulo}</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void cargar()} />
        }
      >
        {cargando && lista.length === 0 ? (
          <ActivityIndicator color={paleta.navy} style={{ marginTop: 40 }} />
        ) : lista.length === 0 ? (
          <View style={estilos.vacio}>
            <Ionicons name={iconoVacio} size={56} color={paleta.skyblue} />
            <Text style={estilos.vacioTitulo}>{vacioTitulo}</Text>
            <Text style={estilos.vacioSub}>{vacioSub}</Text>
          </View>
        ) : (
          lista.map((item) => {
            const abierto = expandido === item.consultaID;
            const fecha = new Date(item.fechaRegistro).toLocaleDateString(
              "es-MX",
              { dateStyle: "medium" },
            );
            return (
              <View key={item.consultaID} style={estilos.card}>
                <View style={estilos.cardHeader}>
                  <View style={estilos.avatar}>
                    <Ionicons name="medkit-outline" size={20} color={paleta.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.medico}>{nombreMedico(item.medico)}</Text>
                    <Text style={estilos.esp}>
                      {item.medico?.especialidad?.nombre ?? "Consulta médica"}
                    </Text>
                  </View>
                  <Text style={estilos.fecha}>{fecha}</Text>
                </View>

                <View style={estilos.seccion}>
                  <Text style={estilos.seccionLabel}>
                    {tipo === "laboratorio" ? "RESULTADOS" : "DIAGNÓSTICO"}
                  </Text>
                  <Text
                    style={estilos.contenido}
                    numberOfLines={abierto ? undefined : 4}
                  >
                    {textoResultado(item, tipo)}
                  </Text>
                  {textoResultado(item, tipo).length > 120 ? (
                    <TouchableOpacity
                      onPress={() =>
                        setExpandido(abierto ? null : item.consultaID)
                      }
                    >
                      <Text style={estilos.verMas}>
                        {abierto ? "Ver menos" : "Ver más"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {tipo === "diagnostico" && item.tratamiento?.trim() ? (
                  <View style={estilos.seccion}>
                    <Text style={estilos.seccionLabel}>TRATAMIENTO</Text>
                    <Text style={estilos.contenido}>{item.tratamiento}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
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
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  medico: { fontSize: 15, fontWeight: "800", color: paleta.navy },
  esp: { fontSize: 12, color: paleta.teal, marginTop: 2 },
  fecha: { fontSize: 11, color: paleta.teal, fontWeight: "600" },
  seccion: {
    backgroundColor: paleta.beige,
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 8,
  },
  seccionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  contenido: { fontSize: 14, color: paleta.navy, lineHeight: 20 },
  verMas: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: paleta.teal,
  },
  vacio: { alignItems: "center", paddingTop: 60 },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: paleta.navy,
    marginTop: 16,
  },
  vacioSub: {
    fontSize: 14,
    color: paleta.teal,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
