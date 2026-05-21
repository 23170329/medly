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
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import {
  crearCheckoutSession,
  marcarAnticipoRealizado,
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
import {
  construirRejillaDia,
  esMismoDia,
  fechasUnicasDesdeSlots,
  HORA_FIN_LABORAL,
  HORA_INICIO_LABORAL,
  INTERVALO_MINUTOS,
  normalizarFechaLocal,
} from "../../../lib/agendaPickerUtils";

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
  /** Día de la rejilla (medianoche local normalizada). */
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  /** Hora elegida "HH:mm" local; debe coincidir con un slot disponible. */
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);


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

  useEffect(() => {
    if (paso !== 3 || slots.length === 0) return;
    const fechas = fechasUnicasDesdeSlots(slots);
    setFechaSeleccionada((prev) => {
      if (prev != null && fechas.some((d) => esMismoDia(d, prev))) {
        return prev;
      }
      return fechas[0] ?? null;
    });
  }, [paso, slots]);

  useEffect(() => {
    setSlotSel(null);
    setHoraSeleccionada(null);
  }, [fechaSeleccionada]);

  const diasConCupo = useMemo(
    () => (paso === 3 ? fechasUnicasDesdeSlots(slots) : []),
    [paso, slots],
  );

  const rejillaHorarios = useMemo(() => {
    if (fechaSeleccionada == null) return [];
    return construirRejillaDia(fechaSeleccionada, slots);
  }, [fechaSeleccionada, slots]);

  const puedeContinuarPaso3 =
    fechaSeleccionada != null &&
    horaSeleccionada != null &&
    slotSel != null;

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
      await marcarAnticipoRealizado(cita.citaID);
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
        <View style={estilos.headerBar}>
          <View style={estilos.headerFila}>
            <TouchableOpacity onPress={retroceder} style={estilos.btnAtras}>
              <Ionicons name="chevron-back" size={24} color={paleta.white} />
            </TouchableOpacity>
            <View style={estilos.headerTextos}>
              <Text style={estilos.tituloPrincipal}>AGENDAR CITA</Text>
              <Indicador />
            </View>
          </View>
        </View>
      )}

      {error != null && paso === 1 && (
        <Text style={estilos.errorTxt}>{error}</Text>
      )}

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
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
            <Text style={estilos.ayudaAgenda}>
              Horario de {HORA_INICIO_LABORAL}:00 a {HORA_FIN_LABORAL}:00 · cada{" "}
              {INTERVALO_MINUTOS} min
            </Text>

            {cargando ? (
              <ActivityIndicator
                style={{ marginVertical: 24 }}
                color={paleta.navy}
              />
            ) : slots.length === 0 || diasConCupo.length === 0 ? (
              <Text style={estilos.sinHorariosTxt}>
                No hay fechas disponibles. Prueba otro médico o sucursal.
              </Text>
            ) : (
              <>
                {fechaSeleccionada != null && (
                  <Text style={estilos.mesTituloAgenda}>
                    {fechaSeleccionada.toLocaleDateString("es-MX", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                )}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={estilos.filaDiasScroll}
                >
                  {diasConCupo.map((d) => {
                    const sel =
                      fechaSeleccionada != null && esMismoDia(d, fechaSeleccionada);
                    return (
                      <Pressable
                        key={normalizarFechaLocal(d)}
                        onPress={() => setFechaSeleccionada(d)}
                        style={({ pressed }) => [
                          estilos.diaChip,
                          sel && estilos.diaChipSel,
                          pressed && !sel && estilos.diaChipPressed,
                        ]}
                      >
                        <Text
                          style={[
                            estilos.diaChipSem,
                            sel && estilos.diaChipSemSel,
                          ]}
                        >
                          {d
                            .toLocaleDateString("es-MX", { weekday: "short" })
                            .replace(".", "")
                            .toUpperCase()}
                        </Text>
                        <Text
                          style={[
                            estilos.diaChipNum,
                            sel && estilos.diaChipNumSel,
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={estilos.leyendaFila}>
                  <View style={estilos.leyendaItem}>
                    <View
                      style={[estilos.leyendaDot, { backgroundColor: paleta.teal }]}
                    />
                    <Text style={estilos.leyendaTxt}>Disponible</Text>
                  </View>
                  <View style={estilos.leyendaItem}>
                    <View
                      style={[
                        estilos.leyendaDot,
                        { backgroundColor: COLORES.peligro },
                      ]}
                    />
                    <Text style={estilos.leyendaTxt}>Ocupado</Text>
                  </View>
                </View>

                <Text style={estilos.subtituloHoras}>HORARIOS</Text>
                <View style={estilos.rejillaHoras}>
                  {rejillaHorarios.map((celda) => {
                    const sel =
                      celda.disponible &&
                      celda.slot != null &&
                      slotSel?.slotID === celda.slot.slotID;
                    if (!celda.disponible) {
                      return (
                        <View
                          key={celda.hora}
                          style={[estilos.celdaHora, estilos.celdaHoraOcupada]}
                          accessibilityState={{ disabled: true }}
                        >
                          <Text style={estilos.celdaHoraTxtOcupada}>
                            {celda.etiqueta}
                          </Text>
                          <Text style={estilos.celdaHoraSubOcupada}>
                            No disponible
                          </Text>
                        </View>
                      );
                    }
                    return (
                      <Pressable
                        key={celda.hora}
                        onPress={() => {
                          if (celda.slot != null) {
                            setSlotSel(celda.slot);
                            setHoraSeleccionada(celda.hora);
                          }
                        }}
                        style={({ pressed }) => [
                          estilos.celdaHora,
                          estilos.celdaHoraLibre,
                          sel && estilos.celdaHoraSel,
                          pressed && !sel && estilos.celdaHoraPressed,
                        ]}
                      >
                        <View style={estilos.celdaHoraInterior}>
                          <Text
                            style={[
                              estilos.celdaHoraTxt,
                              sel && estilos.celdaHoraTxtSel,
                            ]}
                          >
                            {celda.etiqueta}
                          </Text>
                          {sel ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={paleta.white}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                estilos.botonPrimario,
                { marginTop: 28 },
                !puedeContinuarPaso3 && estilos.botonPrimarioDeshab,
              ]}
              onPress={() => avanzar()}
              disabled={!puedeContinuarPaso3}
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

  headerBar: {
    backgroundColor: paleta.headerBar,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: BORDES.radio + 8,
    borderBottomRightRadius: BORDES.radio + 8,
    marginBottom: 8,
    shadowColor: paleta.navy,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTextos: { flex: 1, minWidth: 0 },
  btnAtras: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  tituloPrincipal: {
    fontSize: 15,
    fontWeight: "800",
    color: paleta.white,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  indicadorContenedor: { flexDirection: "row", gap: 8 },
  lineaPaso: { height: 4, flex: 1, maxWidth: 56, borderRadius: 2 },
  lineaPasoActiva: { backgroundColor: paleta.white },
  lineaPasoInactiva: { backgroundColor: "rgba(255,255,255,0.28)" },

  subtitulo: {
    fontSize: 11,
    fontWeight: "bold",
    color: paleta.teal,
    letterSpacing: 1,
    marginBottom: 16,
  },
  ayudaAgenda: {
    fontSize: 12,
    color: paleta.teal,
    opacity: 0.9,
    marginTop: -10,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  mesTituloAgenda: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.navy,
    marginBottom: 12,
    textTransform: "capitalize",
  },
  filaDiasScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 4,
    marginBottom: 16,
  },
  diaChip: {
    width: 64,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BORDES.radio,
    backgroundColor: paleta.white,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    alignItems: "center",
    shadowColor: paleta.navy,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  diaChipSel: {
    backgroundColor: paleta.navy,
    borderColor: paleta.navy,
  },
  diaChipPressed: {
    opacity: 0.88,
  },
  diaChipSem: {
    fontSize: 10,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  diaChipSemSel: { color: "rgba(255,255,255,0.85)" },
  diaChipNum: {
    fontSize: 20,
    fontWeight: "800",
    color: paleta.navy,
  },
  diaChipNumSel: { color: paleta.white },
  leyendaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 18,
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  leyendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leyendaTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: paleta.navy,
  },
  subtituloHoras: {
    fontSize: 10,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 1,
    marginBottom: 12,
  },
  rejillaHoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  celdaHora: {
    width: "48%",
    borderRadius: BORDES.radio,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
    justifyContent: "center",
  },
  celdaHoraLibre: {
    backgroundColor: paleta.white,
    borderWidth: 1,
    borderColor: paleta.skyblue,
  },
  celdaHoraSel: {
    backgroundColor: paleta.navy,
    borderColor: paleta.navy,
  },
  celdaHoraPressed: {
    backgroundColor: paleta.skyblue,
    borderColor: paleta.teal,
  },
  celdaHoraOcupada: {
    backgroundColor: "rgba(230, 57, 70, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(230, 57, 70, 0.45)",
    opacity: 1,
  },
  celdaHoraTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: paleta.navy,
  },
  celdaHoraTxtSel: { color: paleta.white },
  celdaHoraInterior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  celdaHoraTxtOcupada: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORES.peligro,
  },
  celdaHoraSubOcupada: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORES.peligro,
    opacity: 0.85,
    marginTop: 2,
  },
  sinHorariosTxt: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginVertical: 24,
    lineHeight: 20,
  },
  botonPrimarioDeshab: {
    opacity: 0.42,
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
