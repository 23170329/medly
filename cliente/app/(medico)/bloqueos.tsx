import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { EncabezadoPantallaMedico } from "../../componentes/medico/EncabezadoPantallaMedico";
import { CalendarioMedly } from "../../componentes/calendario/CalendarioMedly";
import { normalizarDia } from "../../componentes/calendario/calendarioUtils";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import { crearBloqueoMedico } from "../../lib/medicoApi";

const HORAS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export default function MedicoBloqueos(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [mesVisible, setMesVisible] = useState(() => new Date());
  const [rangoInicio, setRangoInicio] = useState<Date | null>(null);
  const [rangoFin, setRangoFin] = useState<Date | null>(null);
  const [horasSel, setHorasSel] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const toggleHora = (h: string): void => {
    setHorasSel((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort(),
    );
  };

  const diaRef = useMemo(() => rangoInicio ?? rangoFin, [rangoInicio, rangoFin]);

  const bloquear = async (): Promise<void> => {
    if (!token || !diaRef || horasSel.length === 0) {
      Alert.alert(
        "Datos incompletos",
        "Selecciona al menos un día y un horario.",
      );
      return;
    }
    const inicioDia = normalizarDia(rangoInicio ?? rangoFin!);
    const finDia = normalizarDia(rangoFin ?? rangoInicio!);
    const [h0] = horasSel[0].split(":").map(Number);
    const [h1] = horasSel[horasSel.length - 1].split(":").map(Number);

    const inicio = new Date(inicioDia);
    inicio.setHours(h0, 0, 0, 0);
    const fin = new Date(finDia);
    fin.setHours(h1 + 1, 0, 0, 0);

    setEnviando(true);
    try {
      await crearBloqueoMedico(token, {
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      });
      Alert.alert("Listo", "Horario bloqueado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo bloquear.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="BLOQUEAR AGENDA"
          onAtras={() => router.back()}
        />

        <Text style={estilos.instruccion}>
          SELECCIONA FECHAS U HORAS PARA BLOQUEAR
        </Text>

        <CalendarioMedly
          mesVisible={mesVisible}
          onMesVisibleChange={setMesVisible}
          modo="rango"
          rangoInicio={rangoInicio}
          rangoFin={rangoFin}
          onSeleccionRango={(a, b) => {
            setRangoInicio(a);
            setRangoFin(b);
          }}
          minDate={new Date()}
        />

        <Text style={estilos.subHoras}>HORARIOS</Text>
        <View style={estilos.rejillaHoras}>
          {HORAS.map((h) => {
            const sel = horasSel.includes(h);
            return (
              <Pressable
                key={h}
                onPress={() => toggleHora(h)}
                style={[estilos.horaBtn, sel && estilos.horaBtnSel]}
              >
                <Text style={[estilos.horaTxt, sel && estilos.horaTxtSel]}>
                  {h}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[estilos.btnPrimario, enviando && { opacity: 0.7 }]}
          onPress={() => void bloquear()}
          disabled={enviando}
        >
          <Text style={estilos.btnPrimarioTxt}>
            {enviando ? "GUARDANDO…" : "BLOQUEAR AGENDA →"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  instruccion: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: paleta.teal,
    marginBottom: 12,
  },
  subHoras: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.5,
  },
  rejillaHoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  horaBtn: {
    width: "47%",
    paddingVertical: 14,
    borderRadius: BORDES.radio,
    borderWidth: 1.5,
    borderColor: paleta.skyblue,
    backgroundColor: paleta.white,
    alignItems: "center",
  },
  horaBtnSel: {
    backgroundColor: paleta.navy,
    borderColor: paleta.navy,
  },
  horaTxt: { fontSize: 15, fontWeight: "700", color: paleta.navy },
  horaTxtSel: { color: paleta.white },
  btnPrimario: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnPrimarioTxt: {
    color: paleta.white,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.4,
  },
});
