import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../stores/auth.store";

interface CitaRes {
  citaID: number;
  inicio: string;
  paciente?: { nombre: string; apellido_pat: string };
}

interface ConsultaRes {
  consultaID: number;
  fechaRegistro: string;
  diagnosticos?: string | null;
}

export default function MedicoInicio(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const [pend, setPend] = useState<CitaRes[]>([]);
  const [cons, setCons] = useState<ConsultaRes[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/medico/citas/pendientes-atencion`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/medico/consultas`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const d1 = r1.ok ? ((await r1.json()) as CitaRes[]) : [];
      const d2 = r2.ok ? ((await r2.json()) as ConsultaRes[]) : [];
      setPend(Array.isArray(d1) ? d1 : []);
      setCons(Array.isArray(d2) ? d2 : []);
    } catch {
      setPend([]);
      setCons([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void cargar()} />
        }
        contentContainerStyle={estilos.scroll}
      >
        <Text style={estilos.titulo}>Panel médico</Text>
        <Text style={estilos.sub}>
          Cuenta demo: doctor@medly.local. Expediente aislado por médico (NOM-004).
        </Text>

        <Text style={estilos.sec}>Citas pendientes por atender</Text>
        {pend.length === 0 ? (
          <Text style={estilos.vacio}>Sin citas próximas confirmadas.</Text>
        ) : (
          pend.map((c) => (
            <View key={c.citaID} style={estilos.card}>
              <Text style={estilos.cardTit}>
                {c.paciente
                  ? `${c.paciente.nombre} ${c.paciente.apellido_pat}`
                  : `Paciente`}
              </Text>
              <Text style={estilos.cardSub}>
                {new Date(c.inicio).toLocaleString("es-MX")}
              </Text>
            </View>
          ))
        )}

        <Text style={[estilos.sec, { marginTop: 24 }]}>
          Histórico de consultas (solo las tuyas)
        </Text>
        {cons.length === 0 ? (
          <Text style={estilos.vacio}>Aún no hay consultas registradas.</Text>
        ) : (
          cons.slice(0, 15).map((x) => (
            <View key={x.consultaID} style={estilos.card}>
              <Text style={estilos.cardTit}>
                Consulta #{x.consultaID} —{" "}
                {new Date(x.fechaRegistro).toLocaleDateString("es-MX")}
              </Text>
              <Text style={estilos.cardSub} numberOfLines={2}>
                {x.diagnosticos ?? "(sin diagnóstico capturado)"}
              </Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={estilos.btn}
          onPress={() => router.push("/(medico)/consulta-nueva")}
        >
          <Text style={estilos.btnTxt}>Nueva consulta (nota clínica)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btn}
          onPress={() => router.push("/(medico)/bloqueos")}
        >
          <Text style={estilos.btnTxt}>Bloqueos de agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnSec}
          onPress={async () => {
            await cerrarSesion();
            router.replace("/(auth)/iniciar-sesion");
          }}
        >
          <Text style={estilos.btnSecTxt}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 24, paddingBottom: 48 },
  titulo: { fontSize: 22, fontWeight: "800", color: paleta.navy },
  sub: { fontSize: 13, color: paleta.teal, marginTop: 6, marginBottom: 20 },
  sec: {
    fontSize: 12,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  vacio: { fontSize: 14, color: paleta.navy, opacity: 0.6 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: paleta.teal,
  },
  cardTit: { fontWeight: "700", color: paleta.navy },
  cardSub: { fontSize: 13, color: paleta.teal, marginTop: 4 },
  btn: {
    marginTop: 16,
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: paleta.white, fontWeight: "700" },
  btnSec: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: paleta.teal,
    borderRadius: BORDES.radioPill,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecTxt: { color: paleta.teal, fontWeight: "700" },
});
