import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";
import {
  fetchCitasMedico,
  fetchConsultasMedico,
  nombrePaciente,
} from "../../../lib/medicoApi";

interface PacienteLista {
  pacienteID: number;
  nombre: string;
  ultimaVisita: string;
}

export default function ExpedientesBuscar(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [q, setQ] = useState("");
  const [lista, setLista] = useState<PacienteLista[]>([]);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const [citas, consultas] = await Promise.all([
        fetchCitasMedico(token),
        fetchConsultasMedico(token),
      ]);
      const map = new Map<number, PacienteLista>();
      for (const c of citas) {
        const p = c.paciente;
        if (!p) continue;
        const prev = map.get(p.pacienteID);
        const fecha = c.inicio;
        if (!prev || new Date(fecha) > new Date(prev.ultimaVisita)) {
          map.set(p.pacienteID, {
            pacienteID: p.pacienteID,
            nombre: nombrePaciente(p),
            ultimaVisita: fecha,
          });
        }
      }
      for (const x of consultas) {
        const p = x.paciente;
        const pid = p?.pacienteID ?? x.pacienteID;
        if (!pid) continue;
        const fecha = x.fechaRegistro;
        const prev = map.get(pid);
        if (!prev || new Date(fecha) > new Date(prev.ultimaVisita)) {
          map.set(pid, {
            pacienteID: pid,
            nombre: p ? nombrePaciente(p) : `Paciente #${pid}`,
            ultimaVisita: fecha,
          });
        }
      }
      setLista(
        [...map.values()].sort(
          (a, b) =>
            new Date(b.ultimaVisita).getTime() -
            new Date(a.ultimaVisita).getTime(),
        ),
      );
    } catch {
      setLista([]);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const filtrada = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter((p) => p.nombre.toLowerCase().includes(t));
  }, [lista, q]);

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="EXPEDIENTE"
          onAtras={() => router.back()}
        />

        <Text style={estilos.label}>BUSCAR EXPEDIENTE</Text>
        <View style={estilos.busqueda}>
          <Ionicons name="search-outline" size={20} color={paleta.teal} />
          <TextInput
            style={estilos.input}
            placeholder="Nombre del paciente"
            placeholderTextColor={COLORES.textoPlaceholder}
            value={q}
            onChangeText={setQ}
          />
        </View>

        {filtrada.map((p) => (
          <TouchableOpacity
            key={p.pacienteID}
            style={estilos.fila}
            onPress={() =>
              router.push(`/(medico)/expedientes/${p.pacienteID}`)
            }
          >
            <View style={estilos.avatar}>
              <Text style={estilos.avatarTxt}>
                {p.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombre}>{p.nombre}</Text>
              <Text style={estilos.sub}>
                Última visita:{" "}
                {new Date(p.ultimaVisita).toLocaleDateString("es-MX")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={paleta.teal} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  busqueda: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radioPill,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: paleta.navy },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.skyblue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontWeight: "800", color: paleta.navy },
  nombre: { fontSize: 15, fontWeight: "700", color: paleta.navy },
  sub: { fontSize: 12, color: paleta.teal, marginTop: 2 },
});
