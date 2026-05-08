import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import {
  crearCheckoutSession,
  crearCita,
  fetchEspecialidades,
  fetchMedicoSucursales,
  fetchMedicos,
  fetchSlots,
  fetchCita,
  type EspecialidadDto,
  type MedicoDto,
  type MedicoSucursalDto,
  type SlotDto,
} from "../../../lib/medlyApi";

WebBrowser.maybeCompleteAuthSession();

export default function AgendarCitaPantalla() {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [busquedaEsp, setBusquedaEsp] = useState("");
  const [especialidades, setEspecialidades] = useState<EspecialidadDto[]>([]);
  const [espSel, setEspSel] = useState<EspecialidadDto | null>(null);

  const [busquedaMed, setBusquedaMed] = useState("");
  const [medicos, setMedicos] = useState<MedicoDto[]>([]);
  const [medSel, setMedSel] = useState<MedicoDto | null>(null);
  const [sucursalesMed, setSucursalesMed] = useState<MedicoSucursalDto[]>([]);
  const [sucSel, setSucSel] = useState<MedicoSucursalDto | null>(null);

  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [slotSel, setSlotSel] = useState<SlotDto | null>(null);


  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await fetchEspecialidades();
        if (!cancel) setEspecialidades(data);
      } catch {
        if (!cancel) setError("No se pudieron cargar especialidades.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (paso !== 2 || !espSel) return;
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
        if (!cancel) setError("No se pudieron cargar médicos.");
      } finally {
        if (!cancel) setCargando(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [paso, espSel, busquedaMed]);

  const alElegirMedico = async (m: MedicoDto) => {
    setMedSel(m);
    setSucSel(null);
    setCargando(true);
    try {
      const ms = await fetchMedicoSucursales(m.medicoID);
      setSucursalesMed(ms);
      if (ms.length === 1) setSucSel(ms[0]);
    } catch {
      Alert.alert("Error", "No se pudieron cargar sucursales del médico.");
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
      if (data.length === 0) {
        Alert.alert(
          "Sin horarios",
          "No hay cupos libres para este médico en esta sucursal.",
        );
      }
    } catch {
      Alert.alert("Error", "No se pudieron cargar horarios disponibles.");
    } finally {
      setCargando(false);
    }
  }, [medSel, sucSel]);

  useEffect(() => {
    if (paso === 3 && medSel && sucSel) void cargarSlots();
  }, [paso, medSel, sucSel, cargarSlots]);

  const iniciarPollingPago = useCallback(
    (id: number) => {
      const t = setInterval(async () => {
        try {
          const c = await fetchCita(id);
          if (c.estado === "CONFIRMADA") {
            clearInterval(t);
            setPaso(5);
          }
        } catch {
          /* ignore */
        }
      }, 2500);
      setTimeout(() => clearInterval(t), 10 * 60 * 1000);
    },
    [],
  );

  const confirmarYAbrirPago = async () => {
    if (!slotSel || !medSel) return;
    setCargando(true);
    try {
      const cita = await crearCita(slotSel.slotID);
      const { url } = await crearCheckoutSession(cita.citaID);
      if (!url) {
        Alert.alert("Pagos", "No se pudo iniciar el checkout de Stripe.");
        return;
      }
      iniciarPollingPago(cita.citaID);
      await WebBrowser.openBrowserAsync(url);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? JSON.stringify((e as { response?: { data?: unknown } }).response?.data)
          : "Intenta de nuevo.";
      Alert.alert("Error", String(msg));
    } finally {
      setCargando(false);
    }
  };

  const avanzar = () => setPaso((p) => p + 1);
  const retroceder = () => {
    if (paso > 1) setPaso(paso - 1);
    else router.back();
  };
  const finalizar = () => router.replace("/(privado)/inicio");

  const espFiltradas = especialidades.filter((e) =>
    e.nombre.toLowerCase().includes(busquedaEsp.toLowerCase()),
  );

  const nombreMedico = (m: MedicoDto) =>
    `${m.nombre} ${m.apellidoPat}`.trim();

  const formatoSlot = (s: SlotDto) => {
    const d = new Date(s.inicio);
    return {
      fecha: d.toLocaleDateString("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      hora: d.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const fechaExito =
    slotSel != null
      ? new Date(slotSel.inicio).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
        })
      : "";

  const horaExito =
    slotSel != null
      ? new Date(slotSel.inicio).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const Indicador = () => (
    <View style={estilos.indicadorContenedor}>
      {[1, 2, 3, 4].map((num) => (
        <View
          key={num}
          style={[
            estilos.lineaPaso,
            paso >= num ? estilos.lineaPasoActiva : estilos.lineaPasoInactiva,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={estilos.areaSegura}>
      {paso < 5 && (
        <View style={estilos.header}>
          <TouchableOpacity onPress={retroceder} style={estilos.btnAtras}>
            <Ionicons name="chevron-back" size={24} color={paleta.white} />
          </TouchableOpacity>
          <View style={{ marginTop: 20 }}>
            <Text style={estilos.tituloPrincipal}>AGENDAR CITA</Text>
            <Indicador />
          </View>
        </View>
      )}

      {error != null && paso === 1 && (
        <Text style={estilos.errorTxt}>{error}</Text>
      )}

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        {paso === 1 && (
          <View>
            <Text style={estilos.subtitulo}>SELECCIONA ESPECIALIDAD</Text>
            <View style={estilos.buscador}>
              <Ionicons name="search-outline" size={20} color={paleta.teal} />
              <TextInput
                style={estilos.inputBuscador}
                placeholder="BUSCAR ESPECIALIDAD"
                placeholderTextColor={paleta.teal}
                value={busquedaEsp}
                onChangeText={setBusquedaEsp}
              />
            </View>

            <View style={estilos.gridEspecialidades}>
              {espFiltradas.map((esp) => (
                <TouchableOpacity
                  key={esp.especialidadID}
                  style={[
                    estilos.tarjetaEspecialidad,
                    espSel?.especialidadID === esp.especialidadID &&
                      estilos.tarjetaSelec,
                  ]}
                  onPress={() => {
                    setEspSel(esp);
                    setMedSel(null);
                    setSucSel(null);
                    avanzar();
                  }}
                >
                  <Ionicons
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    name={(esp.icono as any) ?? "medkit-outline"}
                    size={32}
                    color={
                      espSel?.especialidadID === esp.especialidadID
                        ? paleta.white
                        : paleta.navy
                    }
                  />
                  <Text
                    style={[
                      estilos.textoEspecialidad,
                      espSel?.especialidadID === esp.especialidadID && {
                        color: paleta.white,
                      },
                    ]}
                  >
                    {esp.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {paso === 2 && (
          <View>
            <Text style={estilos.subtitulo}>MÉDICOS DISPONIBLES</Text>
            <View style={estilos.buscador}>
              <Ionicons name="search-outline" size={20} color={paleta.teal} />
              <TextInput
                style={estilos.inputBuscador}
                placeholder="BUSCAR MEDICO"
                placeholderTextColor={paleta.teal}
                value={busquedaMed}
                onChangeText={setBusquedaMed}
              />
            </View>

            {cargando && paso === 2 && medicos.length === 0 ? (
              <ActivityIndicator color={paleta.navy} />
            ) : (
              medicos.map((med) => (
                <TouchableOpacity
                  key={med.medicoID}
                  style={[
                    estilos.tarjetaMedico,
                    medSel?.medicoID === med.medicoID && {
                      borderWidth: 2,
                      borderColor: paleta.navy,
                    },
                  ]}
                  onPress={() => void alElegirMedico(med)}
                >
                  <View style={estilos.avatarMedico}>
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color={paleta.navy}
                    />
                  </View>
                  <View style={estilos.infoMedico}>
                    <Text style={estilos.nombreMedico}>{nombreMedico(med)}</Text>
                    <Text style={estilos.califMedico}>
                      ★ {med.promedioCalificacion} ({med.totalResenas})
                    </Text>
                    <Text style={estilos.precioMedico}>
                      ${med.precioConsulta} MXN
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {medSel != null && sucursalesMed.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={estilos.subtitulo}>SUCURSAL</Text>
                {sucursalesMed.map((ms) => (
                  <TouchableOpacity
                    key={ms.sucursalID}
                    style={[
                      estilos.tarjetaPago,
                      sucSel?.sucursalID === ms.sucursalID && estilos.pagoSelec,
                    ]}
                    onPress={() => setSucSel(ms)}
                  >
                    <Ionicons
                      name="business-outline"
                      size={22}
                      color={paleta.navy}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={estilos.textoPago}>{ms.sucursal.nombre}</Text>
                      <Text style={estilos.subtextoPago} numberOfLines={2}>
                        {ms.sucursal.direccion}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {medSel != null && sucSel != null && (
              <TouchableOpacity
                style={[estilos.botonPrimario, { marginTop: 24 }]}
                onPress={() => avanzar()}
              >
                <Text style={estilos.textoBotonPrimario}>SIGUIENTE →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {paso === 3 && (
          <View>
            <Text style={estilos.subtitulo}>SELECCIONA FECHA Y HORA</Text>
            {cargando ? (
              <ActivityIndicator color={paleta.navy} />
            ) : (
              <View style={{ gap: 10 }}>
                {slots.map((s) => {
                  const { fecha, hora } = formatoSlot(s);
                  const sel = slotSel?.slotID === s.slotID;
                  return (
                    <TouchableOpacity
                      key={s.slotID}
                      style={[
                        estilos.tarjetaMedico,
                        sel && { borderWidth: 2, borderColor: paleta.navy },
                      ]}
                      onPress={() => setSlotSel(s)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={estilos.nombreMedico}>{fecha}</Text>
                        <Text style={estilos.califMedico}>{hora}</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={paleta.navy}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[estilos.botonPrimario, { marginTop: 30 }]}
              onPress={() => avanzar()}
              disabled={!slotSel}
            >
              <Text style={estilos.textoBotonPrimario}>REALIZAR PAGO →</Text>
            </TouchableOpacity>
          </View>
        )}

        {paso === 4 && medSel != null && slotSel != null && sucSel != null && (
          <View>
            <Text style={estilos.subtitulo}>RESUMEN Y PAGO</Text>

            <View style={estilos.tarjetaResumen}>
              <Text style={estilos.resumenLabel}>CONSULTA MÉDICA</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={estilos.resumenMedico}>{nombreMedico(medSel)}</Text>
                <Text style={estilos.resumenPrecio}>
                  ${medSel.precioConsulta}
                </Text>
              </View>
              <Text style={estilos.resumenEspecialidad}>
                {espSel?.nombre ?? ""}
              </Text>

              <Text style={[estilos.resumenLabel, { marginTop: 15 }]}>
                ANTICIPO (50%)
              </Text>
              <Text style={estilos.resumenFecha}>
                {(parseFloat(medSel.precioConsulta) * 0.5).toFixed(2)} MXN
              </Text>

              <Text style={[estilos.resumenLabel, { marginTop: 15 }]}>
                FECHA Y HORA
              </Text>
              <Text style={estilos.resumenFecha}>
                {formatoSlot(slotSel).fecha} — {formatoSlot(slotSel).hora}
              </Text>

              <Text style={[estilos.resumenLabel, { marginTop: 15 }]}>
                SUCURSAL
              </Text>
              <Text style={estilos.resumenFecha}>{sucSel.sucursal.nombre}</Text>
            </View>

            <TouchableOpacity
              style={[estilos.botonPrimario, { marginTop: 30 }]}
              onPress={() => void confirmarYAbrirPago()}
              disabled={cargando}
            >
              <Text style={estilos.textoBotonPrimario}>
                {cargando ? "PROCESANDO…" : "CONFIRMAR Y PAGAR →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {paso === 5 && medSel != null && slotSel != null && sucSel != null && (
          <View style={estilos.contenedorExito}>
            <View style={estilos.tarjetaExito}>
              <View style={estilos.headerExito}>
                <View style={estilos.circuloCheck}>
                  <Ionicons name="checkmark" size={40} color={paleta.green} />
                </View>
              </View>

              <View style={estilos.bodyExito}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <View>
                    <Text style={estilos.exitoLabel}>ESPECIALISTA</Text>
                    <Text style={estilos.exitoValor}>{nombreMedico(medSel)}</Text>
                    <Text style={estilos.exitoSub}>{espSel?.nombre}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={estilos.exitoLabel}>MONTO TOTAL</Text>
                    <Text style={estilos.exitoValor}>
                      ${medSel.precioConsulta} MXN
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <View>
                    <Text style={estilos.exitoLabel}>FECHA</Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={paleta.navy}
                      />
                      <Text style={estilos.exitoSubVal}> {fechaExito}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={estilos.exitoLabel}>HORA</Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={paleta.navy}
                      />
                      <Text style={estilos.exitoSubVal}> {horaExito}</Text>
                    </View>
                  </View>
                </View>

                <View style={estilos.boxUbicacion}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={paleta.teal}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={estilos.exitoLabel}>LUGAR</Text>
                    <Text style={estilos.exitoSubVal}>
                      {sucSel.sucursal.nombre} — {sucSel.sucursal.direccion}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[estilos.botonPrimario, { marginTop: 40, width: "100%" }]}
              onPress={finalizar}
            >
              <Text style={estilos.textoBotonPrimario}>VOLVER AL INICIO</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { flexGrow: 1, padding: 24 },
  errorTxt: { color: "red", paddingHorizontal: 24 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  btnAtras: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  tituloPrincipal: {
    fontSize: 16,
    fontWeight: "bold",
    color: paleta.navy,
    letterSpacing: 1,
    marginBottom: 10,
  },
  indicadorContenedor: { flexDirection: "row", gap: 6 },
  lineaPaso: { height: 4, width: 24, borderRadius: 2 },
  lineaPasoActiva: { backgroundColor: paleta.navy },
  lineaPasoInactiva: { backgroundColor: paleta.skyblue },

  subtitulo: {
    fontSize: 11,
    fontWeight: "bold",
    color: paleta.teal,
    letterSpacing: 1,
    marginBottom: 16,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 24,
    shadowColor: paleta.navy,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputBuscador: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: paleta.navy,
  },

  gridEspecialidades: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  tarjetaEspecialidad: {
    width: "47%",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: paleta.navy,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tarjetaSelec: { backgroundColor: paleta.navy },
  textoEspecialidad: {
    fontSize: 13,
    fontWeight: "600",
    color: paleta.navy,
    marginTop: 12,
  },

  tarjetaMedico: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    shadowColor: paleta.navy,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarMedico: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: paleta.skyblue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoMedico: { flex: 1 },
  nombreMedico: { fontSize: 15, fontWeight: "bold", color: paleta.navy },
  califMedico: { fontSize: 12, color: paleta.teal },
  precioMedico: { fontSize: 12, color: paleta.teal, marginTop: 4 },

  tarjetaResumen: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio + 4,
    padding: 24,
  },
  resumenLabel: {
    fontSize: 10,
    color: paleta.skyblue,
    letterSpacing: 1,
    marginBottom: 6,
  },
  resumenMedico: { fontSize: 20, fontWeight: "bold", color: paleta.white },
  resumenPrecio: { fontSize: 20, fontWeight: "bold", color: paleta.white },
  resumenEspecialidad: { fontSize: 13, color: paleta.skyblue },
  resumenFecha: { fontSize: 14, color: paleta.white, fontWeight: "500" },

  tarjetaPago: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: paleta.navy,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pagoSelec: { borderColor: paleta.navy },
  textoPago: { fontSize: 15, fontWeight: "600", color: paleta.navy },
  subtextoPago: { fontSize: 12, color: paleta.teal },

  botonPrimario: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radio,
    paddingVertical: 16,
    alignItems: "center",
  },
  textoBotonPrimario: {
    color: paleta.white,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  contenedorExito: { flex: 1, justifyContent: "center", paddingTop: 20 },
  tarjetaExito: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio + 8,
    overflow: "hidden",
    shadowColor: paleta.navy,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  headerExito: {
    backgroundColor: paleta.green,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  circuloCheck: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: paleta.white,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  bodyExito: { padding: 24, paddingTop: 40 },
  exitoLabel: {
    fontSize: 10,
    color: paleta.teal,
    letterSpacing: 1,
    marginBottom: 4,
  },
  exitoValor: { fontSize: 16, fontWeight: "bold", color: paleta.navy },
  exitoSub: { fontSize: 12, color: paleta.teal },
  exitoSubVal: { fontSize: 13, fontWeight: "600", color: paleta.navy },
  boxUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondo,
    padding: 16,
    borderRadius: BORDES.radio,
    marginTop: 10,
  },
});
