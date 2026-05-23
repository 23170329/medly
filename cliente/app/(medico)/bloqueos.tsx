import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../componentes/medico/EncabezadoPantallaMedico";
import { CalendarioMedly } from "../../componentes/calendario/CalendarioMedly";
import { normalizarDia } from "../../componentes/calendario/calendarioUtils";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import {
  crearBloqueoMedico,
  eliminarBloqueoMedico,
  fetchBloqueosMedico,
  type BloqueoDto,
} from "../../lib/medicoApi";

const HORAS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function formatearRangoBloqueo(inicio: string, fin: string): string {
  const a = new Date(inicio);
  const b = new Date(fin);
  const f = (d: Date) =>
    d.toLocaleString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${f(a)} → ${f(b)}`;
}

export default function MedicoBloqueos(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [mesVisible, setMesVisible] = useState(() => new Date());
  const [rangoInicio, setRangoInicio] = useState<Date | null>(null);
  const [rangoFin, setRangoFin] = useState<Date | null>(null);
  const [horasSel, setHorasSel] = useState<string[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoDto[]>([]);
  const [enviando, setEnviando] = useState(false);

  const cargarBloqueos = useCallback(async () => {
    if (!token) return;
    try {
      const lista = await fetchBloqueosMedico(token);
      setBloqueos(lista);
    } catch {
      setBloqueos([]);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void cargarBloqueos();
    }, [cargarBloqueos]),
  );

  const toggleHora = (h: string): void => {
    setHorasSel((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort(),
    );
  };

  const diaRef = useMemo(() => rangoInicio ?? rangoFin, [rangoInicio, rangoFin]);

  const bloqueosFuturos = useMemo(
    () =>
      bloqueos.filter((b) => new Date(b.fin).getTime() >= Date.now()),
    [bloqueos],
  );

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
      setHorasSel([]);
      await cargarBloqueos();
      Alert.alert("Listo", "Horario bloqueado correctamente.");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo bloquear.");
    } finally {
      setEnviando(false);
    }
  };

  const desbloquear = (b: BloqueoDto): void => {
    Alert.alert(
      "Desbloquear agenda",
      `¿Quitar el bloqueo del ${formatearRangoBloqueo(b.inicio, b.fin)}? Se regenerarán los cupos libres en ese periodo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desbloquear",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!token) return;
              setEnviando(true);
              try {
                await eliminarBloqueoMedico(token, b.bloqueoID);
                await cargarBloqueos();
                Alert.alert("Listo", "Bloqueo eliminado. La agenda quedó disponible.");
              } catch (e: unknown) {
                Alert.alert(
                  "Error",
                  e instanceof Error ? e.message : "No se pudo desbloquear.",
                );
              } finally {
                setEnviando(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <EncabezadoPantallaMedico
          titulo="GESTIONAR AGENDA"
          onAtras={() => router.back()}
        />

        <Text style={estilos.instruccion}>
          BLOQUEAR: selecciona fechas y horarios. DESBLOQUEAR: quita un bloqueo
          activo si te equivocaste o ya podrás atender.
        </Text>

        {bloqueosFuturos.length > 0 && (
          <View style={estilos.seccionLista}>
            <Text style={estilos.subTituloSeccion}>BLOQUEOS ACTIVOS</Text>
            {bloqueosFuturos.map((b) => (
              <View key={b.bloqueoID} style={estilos.itemBloqueo}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.itemBloqueoTxt} numberOfLines={2}>
                    {formatearRangoBloqueo(b.inicio, b.fin)}
                  </Text>
                  {b.motivo ? (
                    <Text style={estilos.itemMotivo}>{b.motivo}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={estilos.btnDesbloquear}
                  onPress={() => desbloquear(b)}
                  accessibilityLabel="Desbloquear este periodo"
                >
                  <Ionicons name="lock-open-outline" size={16} color={paleta.red} />
                  <Text style={estilos.btnDesbloquearTxt}>Desbloquear</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={estilos.subTituloSeccion}>NUEVO BLOQUEO</Text>

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
    fontWeight: "600",
    letterSpacing: 0.3,
    color: paleta.teal,
    marginBottom: 16,
    lineHeight: 17,
  },
  seccionLista: { marginBottom: 20 },
  subTituloSeccion: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  itemBloqueo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  itemBloqueoTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: paleta.navy,
    lineHeight: 17,
  },
  itemMotivo: { fontSize: 11, color: paleta.teal, marginTop: 4 },
  btnDesbloquear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.red,
    flexShrink: 0,
  },
  btnDesbloquearTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: paleta.red,
  },
  subHoras: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 0.5,
  },
  rejillaHoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  horaBtn: {
    width: "31%",
    paddingVertical: 12,
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
  horaTxt: { fontSize: 14, fontWeight: "700", color: paleta.navy },
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
