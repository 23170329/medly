import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
// --- MOCK DATA ---
const ESPECIALIDADES = [
  { id: "1", nombre: "Cardiología", icono: "heart-outline" },
  { id: "2", nombre: "Pediatría", icono: "happy-outline" },
  { id: "3", nombre: "Psicología", icono: "git-network-outline" },
  { id: "4", nombre: "Ginecología", icono: "female-outline" },
];

const MEDICOS = [
  {
    id: "1",
    nombre: "Dra. Alejandra",
    calificacion: 4.9,
    precio: 500,
    especialidad: "Cardiología",
  },
  {
    id: "2",
    nombre: "Dra. Sarah",
    calificacion: 4.9,
    precio: 500,
    especialidad: "Cardiología",
  },
  {
    id: "3",
    nombre: "Dr. John",
    calificacion: 4.9,
    precio: 500,
    especialidad: "Cardiología",
  },
];

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
const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const DIAS_NUMEROS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, "", "", "", ""],
];

export default function AgendarCitaPantalla() {
  const [paso, setPaso] = useState(1);

  // Estados de la cita
  const [busqueda, setBusqueda] = useState("");
  const [especialidadSelec, setEspecialidadSelec] = useState("");
  const [medicoSelec, setMedicoSelec] = useState<any>(null);
  const [diaSelec, setDiaSelec] = useState<number>(1);
  const [horaSelec, setHoraSelec] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("visa");

  const avanzar = () => setPaso(paso + 1);
  const retroceder = () => {
    if (paso > 1) setPaso(paso - 1);
    else router.back();
  };
  const finalizar = () => router.replace("/(privado)/inicio");

  // Componente indicador de pasos (las barritas)
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
      {/* HEADER (No se muestra en el paso 5 de Éxito) */}
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

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* === PASO 1: ESPECIALIDAD === */}
        {paso === 1 && (
          <View>
            <Text style={estilos.subtitulo}>SELECCIONA ESPECIALIDAD</Text>
            <View style={estilos.buscador}>
              <Ionicons name="search-outline" size={20} color={paleta.teal} />
              <TextInput
                style={estilos.inputBuscador}
                placeholder="BUSCAR ESPECIALIDAD"
                placeholderTextColor={paleta.teal}
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>

            <View style={estilos.gridEspecialidades}>
              {ESPECIALIDADES.map((esp) => (
                <TouchableOpacity
                  key={esp.id}
                  style={[
                    estilos.tarjetaEspecialidad,
                    especialidadSelec === esp.nombre && estilos.tarjetaSelec,
                  ]}
                  onPress={() => {
                    setEspecialidadSelec(esp.nombre);
                    avanzar();
                  }}
                >
                  <Ionicons
                    name={esp.icono as any}
                    size={32}
                    color={
                      especialidadSelec === esp.nombre
                        ? paleta.white
                        : paleta.navy
                    }
                  />
                  <Text
                    style={[
                      estilos.textoEspecialidad,
                      especialidadSelec === esp.nombre && {
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

        {/* === PASO 2: MEDICO === */}
        {paso === 2 && (
          <View>
            <Text style={estilos.subtitulo}>MÉDICOS DISPONIBLES</Text>
            <View style={estilos.buscador}>
              <Ionicons name="search-outline" size={20} color={paleta.teal} />
              <TextInput
                style={estilos.inputBuscador}
                placeholder="BUSCAR MEDICO"
                placeholderTextColor={paleta.teal}
              />
            </View>

            {MEDICOS.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={estilos.tarjetaMedico}
                onPress={() => {
                  setMedicoSelec(med);
                  avanzar();
                }}
              >
                <View style={estilos.avatarMedico}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={paleta.navy}
                  />
                </View>
                <View style={estilos.infoMedico}>
                  <Text style={estilos.nombreMedico}>{med.nombre}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={estilos.califMedico}> {med.calificacion}</Text>
                  </View>
                  <Text style={estilos.precioMedico}>${med.precio} MXN</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={paleta.navy} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* === PASO 3: FECHA Y HORA === */}
        {paso === 3 && (
          <View>
            <Text style={estilos.subtitulo}>SELECCIONA FECHA Y HORA</Text>

            {/* Calendario Mock */}
            <View style={estilos.calendarioGrid}>
              <View style={estilos.calendarioFila}>
                {DIAS_SEMANA.map((dia) => (
                  <Text key={dia} style={estilos.diaSemana}>
                    {dia}
                  </Text>
                ))}
              </View>
              {DIAS_NUMEROS.map((semana, index) => (
                <View key={index} style={estilos.calendarioFila}>
                  {semana.map((diaNum, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        estilos.diaBoton,
                        diaSelec === diaNum && estilos.diaSelecBtn,
                      ]}
                      onPress={() =>
                        diaNum !== "" && setDiaSelec(diaNum as number)
                      }
                      disabled={diaNum === ""}
                    >
                      <Text
                        style={[
                          estilos.diaTexto,
                          diaSelec === diaNum && { color: paleta.white },
                        ]}
                      >
                        {diaNum < 10 && diaNum !== "" ? `0${diaNum}` : diaNum}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View style={estilos.gridHoras}>
              {HORAS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    estilos.horaBoton,
                    horaSelec === h && estilos.horaSelecBtn,
                  ]}
                  onPress={() => setHoraSelec(h)}
                >
                  <Text
                    style={[
                      estilos.horaTexto,
                      horaSelec === h && { color: paleta.white },
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[estilos.botonPrimario, { marginTop: 30 }]}
              onPress={avanzar}
              disabled={!horaSelec}
            >
              <Text style={estilos.textoBotonPrimario}>REALIZAR PAGO →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* === PASO 4: RESUMEN Y PAGO === */}
        {paso === 4 && (
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
                <Text style={estilos.resumenMedico}>{medicoSelec?.nombre}</Text>
                <Text style={estilos.resumenPrecio}>
                  ${medicoSelec?.precio}
                </Text>
              </View>
              <Text style={estilos.resumenEspecialidad}>
                {medicoSelec?.especialidad}
              </Text>

              <Text style={[estilos.resumenLabel, { marginTop: 15 }]}>
                FECHA Y HORA
              </Text>
              <Text style={estilos.resumenFecha}>26 Marzo - {horaSelec}</Text>
            </View>

            <Text style={[estilos.subtitulo, { marginTop: 30 }]}>
              MÉTODO DE PAGO
            </Text>

            <TouchableOpacity
              style={[
                estilos.tarjetaPago,
                metodoPago === "visa" && estilos.pagoSelec,
              ]}
              onPress={() => setMetodoPago("visa")}
            >
              <Ionicons name="card-outline" size={24} color={paleta.navy} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={estilos.textoPago}>Visa ****4242</Text>
                <Text style={estilos.subtextoPago}>Vence 12/28</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={paleta.navy} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.tarjetaPago,
                metodoPago === "paypal" && estilos.pagoSelec,
              ]}
              onPress={() => setMetodoPago("paypal")}
            >
              <Ionicons name="logo-paypal" size={24} color={paleta.navy} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={estilos.textoPago}>PayPal</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={paleta.navy} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.botonPrimario, { marginTop: 30 }]}
              onPress={avanzar}
            >
              <Text style={estilos.textoBotonPrimario}>
                CONFIRMAR Y PAGAR →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* === PASO 5: ÉXITO === */}
        {paso === 5 && (
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
                    <Text style={estilos.exitoValor}>
                      {medicoSelec?.nombre}
                    </Text>
                    <Text style={estilos.exitoSub}>
                      {medicoSelec?.especialidad}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={estilos.exitoLabel}>MONTO</Text>
                    <Text style={estilos.exitoValor}>
                      ${medicoSelec?.precio} MXN
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
                      <Text style={estilos.exitoSubVal}> 26 de Marzo</Text>
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
                      <Text style={estilos.exitoSubVal}> {horaSelec}</Text>
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
                      Consultorio 402, Medly Corp Central
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons
                      name="download-outline"
                      size={16}
                      color={paleta.teal}
                    />
                    <Text style={estilos.linkText}> GUARDAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={16}
                      color={paleta.teal}
                    />
                    <Text style={estilos.linkText}> ENVIAR</Text>
                  </TouchableOpacity>
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

  calendarioGrid: { marginBottom: 24 },
  calendarioFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  diaSemana: {
    fontSize: 12,
    fontWeight: "bold",
    color: paleta.navy,
    width: 35,
    textAlign: "center",
  },
  diaBoton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
  },
  diaSelecBtn: { backgroundColor: paleta.navy },
  diaTexto: { fontSize: 13, color: paleta.navy, fontWeight: "500" },

  gridHoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  horaBoton: {
    width: "22%",
    backgroundColor: paleta.white,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: paleta.navy,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  horaSelecBtn: { backgroundColor: paleta.navy },
  horaTexto: { fontSize: 13, fontWeight: "600", color: paleta.navy },

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
  linkText: { fontSize: 12, fontWeight: "bold", color: paleta.teal },
});
