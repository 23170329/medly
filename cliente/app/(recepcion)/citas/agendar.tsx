import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EncabezadoPantallaMedico } from "../../../componentes/medico/EncabezadoPantallaMedico";
import { IndicadorPasos } from "../../../componentes/comunes/IndicadorPasos";
import { CalendarioMedly } from "../../../componentes/calendario/CalendarioMedly";
import { normalizarDia } from "../../../componentes/calendario/calendarioUtils";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";
import {
  fetchEspecialidades,
  fetchMedicoSucursales,
  fetchMedicos,
  fetchSlots,
  type EspecialidadDto,
  type MedicoDto,
  type MedicoSucursalDto,
  type SlotDto,
} from "../../../lib/medlyApi";
import {
  buscarPacientesRecepcion,
  crearCitaMostradorRecepcion,
  fetchPacienteRecepcion,
  nombrePacienteRecep,
  type PacienteBusquedaDto,
} from "../../../lib/recepcionApi";
import { validarCurpPaciente } from "../../../lib/validacionRegistro";
import {
  construirRejillaDia,
  esMismoDia,
  fechasUnicasDesdeSlots,
} from "../../../lib/agendaPickerUtils";

const TOTAL_PASOS = 5;

export default function RecepcionAgendarCita(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);

  const [busquedaPac, setBusquedaPac] = useState("");
  const [pacientes, setPacientes] = useState<PacienteBusquedaDto[]>([]);
  const [pacSel, setPacSel] = useState<PacienteBusquedaDto | null>(null);

  const [busquedaEsp, setBusquedaEsp] = useState("");
  const [especialidades, setEspecialidades] = useState<EspecialidadDto[]>([]);
  const [espSel, setEspSel] = useState<EspecialidadDto | null>(null);

  const [busquedaMed, setBusquedaMed] = useState("");
  const [medicos, setMedicos] = useState<MedicoDto[]>([]);
  const [medSel, setMedSel] = useState<MedicoDto | null>(null);
  const [sucSel, setSucSel] = useState<MedicoSucursalDto | null>(null);

  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [slotSel, setSlotSel] = useState<SlotDto | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [mesAgenda, setMesAgenda] = useState(() => new Date());
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "transferencia" | null>(
    null,
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await fetchEspecialidades();
        if (!cancel) setEspecialidades(data);
      } catch {
        if (!cancel) Alert.alert("Error", "No se pudieron cargar especialidades.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (paso !== 1 || busquedaPac.trim().length < 2) {
      setPacientes([]);
      return;
    }
    if (!token) return;
    const t = setTimeout(() => {
      void buscarPacientesRecepcion(token, busquedaPac)
        .then(setPacientes)
        .catch(() => setPacientes([]));
    }, 350);
    return () => clearTimeout(t);
  }, [paso, busquedaPac, token]);

  useEffect(() => {
    if (paso !== 3 || !espSel) return;
    let cancel = false;
    (async () => {
      setCargando(true);
      try {
        const data = await fetchMedicos({
          especialidadId: espSel.especialidadID,
          q: busquedaMed.trim() || undefined,
        });
        if (!cancel) setMedicos(data);
      } catch {
        if (!cancel) Alert.alert("Error", "No se pudieron cargar médicos.");
      } finally {
        if (!cancel) setCargando(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [paso, espSel, busquedaMed]);

  const alElegirMedico = async (m: MedicoDto): Promise<void> => {
    setMedSel(m);
    setSucSel(null);
    setCargando(true);
    try {
      const ms = await fetchMedicoSucursales(m.medicoID);
      setSucSel(ms.length === 1 ? ms[0] : ms[0] ?? null);
    } catch {
      Alert.alert("Error", "No se pudieron cargar sucursales.");
    } finally {
      setCargando(false);
    }
  };

  const cargarSlots = useCallback(async () => {
    if (!medSel || !sucSel) return;
    setCargando(true);
    try {
      const data = await fetchSlots({
        medicoId: medSel.medicoID,
        sucursalId: sucSel.sucursalID,
      });
      setSlots(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar horarios.");
    } finally {
      setCargando(false);
    }
  }, [medSel, sucSel]);

  useEffect(() => {
    if (paso === 4 && medSel && sucSel) void cargarSlots();
  }, [paso, medSel, sucSel, cargarSlots]);

  useEffect(() => {
    if (paso !== 4 || slots.length === 0) return;
    const fechas = fechasUnicasDesdeSlots(slots);
    setFechaSeleccionada((prev) => {
      if (prev != null && fechas.some((d) => esMismoDia(d, prev))) return prev;
      return fechas[0] ?? null;
    });
  }, [paso, slots]);

  useEffect(() => {
    setSlotSel(null);
    setHoraSeleccionada(null);
  }, [fechaSeleccionada]);

  const diasConCupo = useMemo(
    () => (paso === 4 ? fechasUnicasDesdeSlots(slots) : []),
    [paso, slots],
  );

  const diasConCupoSet = useMemo(() => {
    const set = new Set<string>();
    for (const d of diasConCupo) {
      set.add(normalizarDia(d).toISOString());
    }
    return set;
  }, [diasConCupo]);

  const rejillaHorarios = useMemo(() => {
    if (fechaSeleccionada == null) return [];
    return construirRejillaDia(fechaSeleccionada, slots);
  }, [fechaSeleccionada, slots]);

  const precio = medSel ? parseFloat(String(medSel.precioConsulta)) : 0;
  const anticipo = Math.round(precio * 0.5 * 100) / 100;

  const espFiltradas = useMemo(() => {
    const q = busquedaEsp.trim().toLowerCase();
    if (!q) return especialidades;
    return especialidades.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [especialidades, busquedaEsp]);

  const validarPacienteAntesPago = async (): Promise<boolean> => {
    if (!pacSel || !token) return false;
    try {
      const perfil = await fetchPacienteRecepcion(token, pacSel.pacienteID);
      const err = validarCurpPaciente(perfil);
      if (err) {
        Alert.alert("CURP del paciente", err);
        return false;
      }
      return true;
    } catch {
      Alert.alert("Error", "No se pudieron verificar los datos del paciente.");
      return false;
    }
  };

  const confirmarPago = async (): Promise<void> => {
    if (!pacSel || !slotSel || !metodoPago || !token) return;
    const okCurp = await validarPacienteAntesPago();
    if (!okCurp) return;

    if (metodoPago === "transferencia") {
      router.push({
        pathname: "/(recepcion)/citas/pendiente",
        params: {
          pacienteId: String(pacSel.pacienteID),
          slotID: String(slotSel.slotID),
          paciente: nombrePacienteRecep(pacSel),
          medico: `${medSel?.nombre ?? ""} ${medSel?.apellidoPat ?? ""}`.trim(),
          especialidad: espSel?.nombre ?? "",
          inicio: slotSel.inicio,
          anticipo: String(anticipo),
          total: String(precio),
          sucursal: sucSel?.sucursal?.nombre ?? "",
        },
      });
      return;
    }
    setCargando(true);
    try {
      const cita = await crearCitaMostradorRecepcion(
        token,
        pacSel.pacienteID,
        slotSel.slotID,
      );
      router.replace({
        pathname: "/(recepcion)/citas/confirmada",
        params: {
          citaId: String(cita.citaID),
          paciente: nombrePacienteRecep(pacSel),
          medico: `${medSel?.nombre ?? ""} ${medSel?.apellidoPat ?? ""}`.trim(),
          especialidad: espSel?.nombre ?? "",
          inicio: cita.inicio,
          total: cita.montoTotal,
          anticipo: cita.montoAnticipo,
          mensaje:
            cita.mensaje ??
            "Anticipo del 50% registrado correctamente.",
          sucursal: sucSel?.sucursal?.nombre ?? "",
        },
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo confirmar.");
    } finally {
      setCargando(false);
    }
  };

  const titulos: Record<number, string> = {
    1: "BUSCAR PACIENTE",
    2: "BUSCAR ESPECIALIDAD",
    3: "BUSCAR MÉDICO",
    4: "FECHA Y HORA",
    5: "RESUMEN Y PAGO",
  };

  const puedeContinuar = (): boolean => {
    if (paso === 1) return pacSel != null;
    if (paso === 2) return espSel != null;
    if (paso === 3) return medSel != null && sucSel != null;
    if (paso === 4) return slotSel != null && horaSeleccionada != null;
    if (paso === 5) return metodoPago != null;
    return false;
  };

  const onContinuar = (): void => {
    if (paso < 5) {
      setPaso((p) => p + 1);
      return;
    }
    void confirmarPago();
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <EncabezadoPantallaMedico
          titulo="AGENDAR CITA"
          onAtras={() => (paso > 1 ? setPaso((p) => p - 1) : router.back())}
        />
        <IndicadorPasos total={TOTAL_PASOS} actual={paso} />
        <Text style={estilos.subtitulo}>{titulos[paso]}</Text>

        {paso === 1 && (
          <>
            <View style={estilos.busqueda}>
              <Ionicons name="search" size={18} color={paleta.teal} />
              <TextInput
                style={estilos.busquedaInput}
                placeholder="Nombre del paciente"
                placeholderTextColor={paleta.teal}
                value={busquedaPac}
                onChangeText={setBusquedaPac}
              />
            </View>
            {pacientes.map((p) => (
              <TouchableOpacity
                key={p.pacienteID}
                style={[estilos.card, pacSel?.pacienteID === p.pacienteID && estilos.cardSel]}
                onPress={() => setPacSel(p)}
              >
                <Text style={estilos.cardTit}>{nombrePacienteRecep(p)}</Text>
                <Text style={estilos.cardSub}>{p.correoElectronico}</Text>
              </TouchableOpacity>
            ))}
            {busquedaPac.length >= 2 && pacientes.length === 0 && (
              <Text style={estilos.aviso}>Sin resultados. Registra al paciente primero.</Text>
            )}
          </>
        )}

        {paso === 2 && (
          <>
            <View style={estilos.busqueda}>
              <Ionicons name="search" size={18} color={paleta.teal} />
              <TextInput
                style={estilos.busquedaInput}
                placeholder="Especialidad"
                placeholderTextColor={paleta.teal}
                value={busquedaEsp}
                onChangeText={setBusquedaEsp}
              />
            </View>
            <View style={estilos.gridEsp}>
              {espFiltradas.map((e) => (
                <TouchableOpacity
                  key={e.especialidadID}
                  style={[estilos.espCard, espSel?.especialidadID === e.especialidadID && estilos.cardSel]}
                  onPress={() => setEspSel(e)}
                >
                  <Ionicons name="medkit-outline" size={24} color={paleta.navy} />
                  <Text style={estilos.espNombre}>{e.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {paso === 3 && (
          <>
            <View style={estilos.busqueda}>
              <Ionicons name="search" size={18} color={paleta.teal} />
              <TextInput
                style={estilos.busquedaInput}
                placeholder="Médico"
                placeholderTextColor={paleta.teal}
                value={busquedaMed}
                onChangeText={setBusquedaMed}
              />
            </View>
            {cargando && <ActivityIndicator color={paleta.navy} />}
            {medicos.map((m) => (
              <TouchableOpacity
                key={m.medicoID}
                style={[estilos.card, medSel?.medicoID === m.medicoID && estilos.cardSel]}
                onPress={() => void alElegirMedico(m)}
              >
                <Text style={estilos.cardTit}>
                  {m.nombre} {m.apellidoPat}
                </Text>
                <Text style={estilos.cardSub}>
                  {espSel?.nombre} · ${m.precioConsulta}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {paso === 4 && (
          <>
            {cargando ? (
              <ActivityIndicator color={paleta.navy} style={{ marginVertical: 24 }} />
            ) : (
              <>
                <CalendarioMedly
                  mesVisible={mesAgenda}
                  onMesVisibleChange={setMesAgenda}
                  modo="dia"
                  fechaSeleccionada={fechaSeleccionada}
                  onSeleccionDia={setFechaSeleccionada}
                  diaHabilitado={(d) =>
                    diasConCupoSet.has(normalizarDia(d).toISOString())
                  }
                />
                <Text style={estilos.horasTit}>HORARIOS DISPONIBLES</Text>
                <View style={estilos.rejillaHoras}>
                  {rejillaHorarios.map((celda) => {
                    const activo = horaSeleccionada === celda.hora;
                    const deshab = !celda.disponible;
                    return (
                      <Pressable
                        key={celda.hora}
                        disabled={deshab}
                        style={[
                          estilos.horaBtn,
                          activo && estilos.horaBtnActivo,
                          deshab && estilos.horaBtnOff,
                        ]}
                        onPress={() => {
                          setHoraSeleccionada(celda.hora);
                          setSlotSel(celda.slot ?? null);
                        }}
                      >
                        <Text
                          style={[
                            estilos.horaTxt,
                            activo && estilos.horaTxtActivo,
                            deshab && estilos.horaTxtOff,
                          ]}
                        >
                          {celda.hora}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {paso === 5 && pacSel && medSel && slotSel && (
          <>
            <View style={estilos.resumenCard}>
              <Text style={estilos.resumenMed}>
                {medSel.nombre} {medSel.apellidoPat}
              </Text>
              <Text style={estilos.resumenSub}>{espSel?.nombre}</Text>
              <Text style={estilos.resumenSub}>
                {new Date(slotSel.inicio).toLocaleString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={estilos.resumenPrecio}>${precio.toFixed(0)} MXN</Text>
              <Text style={estilos.resumenAnticipo}>
                Anticipo 50%: ${anticipo.toFixed(0)}
              </Text>
            </View>
            <Text style={estilos.metodoTit}>MÉTODO DE PAGO</Text>
            <View style={estilos.metodoRow}>
              <TouchableOpacity
                style={[
                  estilos.metodoBtn,
                  metodoPago === "transferencia" && estilos.metodoBtnActivo,
                ]}
                onPress={() => setMetodoPago("transferencia")}
              >
                <Ionicons name="card-outline" size={22} color={paleta.navy} />
                <Text style={estilos.metodoTxt}>Tarjeta / transferencia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.metodoBtn,
                  metodoPago === "efectivo" && estilos.metodoBtnActivo,
                ]}
                onPress={() => setMetodoPago("efectivo")}
              >
                <Ionicons name="cash-outline" size={22} color={paleta.navy} />
                <Text style={estilos.metodoTxt}>Efectivo</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[estilos.btnPrim, (!puedeContinuar() || cargando) && estilos.btnOff]}
          disabled={!puedeContinuar() || cargando}
          onPress={() => void onContinuar()}
        >
          {cargando ? (
            <ActivityIndicator color={paleta.white} />
          ) : (
            <Text style={estilos.btnPrimTxt}>
              {paso === 5 ? "CONFIRMAR Y PAGAR" : paso === 4 ? "REALIZAR PAGO" : "CONTINUAR"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 20, paddingBottom: 40 },
  subtitulo: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: paleta.teal,
    marginBottom: 12,
  },
  busqueda: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 8,
  },
  busquedaInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: paleta.navy },
  card: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSel: { borderColor: paleta.teal },
  cardTit: { fontSize: 15, fontWeight: "700", color: paleta.navy },
  cardSub: { fontSize: 12, color: paleta.teal, marginTop: 4 },
  aviso: { textAlign: "center", color: paleta.teal, marginTop: 12 },
  gridEsp: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  espCard: {
    width: "47%",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  espNombre: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: paleta.navy,
    textAlign: "center",
  },
  horasTit: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginTop: 16,
    marginBottom: 8,
  },
  rejillaHoras: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  horaBtn: {
    width: "30%",
    paddingVertical: 10,
    borderRadius: BORDES.radio,
    backgroundColor: paleta.white,
    alignItems: "center",
  },
  horaBtnActivo: { backgroundColor: paleta.navy },
  horaBtnOff: { opacity: 0.35 },
  horaTxt: { fontSize: 13, fontWeight: "600", color: paleta.navy },
  horaTxtActivo: { color: paleta.white },
  horaTxtOff: { color: paleta.teal },
  resumenCard: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio,
    padding: 18,
    marginBottom: 16,
  },
  resumenMed: { fontSize: 18, fontWeight: "800", color: paleta.white },
  resumenSub: { fontSize: 13, color: paleta.skyblue, marginTop: 4 },
  resumenPrecio: {
    fontSize: 22,
    fontWeight: "800",
    color: paleta.white,
    marginTop: 12,
  },
  resumenAnticipo: { fontSize: 12, color: paleta.skyblue, marginTop: 4 },
  metodoTit: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 10,
  },
  metodoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  metodoBtn: {
    flex: 1,
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  metodoBtnActivo: { borderColor: paleta.teal },
  metodoTxt: { fontSize: 12, fontWeight: "700", color: paleta.navy },
  btnPrim: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnOff: { opacity: 0.45 },
  btnPrimTxt: { color: paleta.white, fontWeight: "800", fontSize: 14 },
});
