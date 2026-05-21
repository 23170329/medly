import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES, BORDES } from "../../constants/theme";
import { useAuthStore, type Usuario } from "../../stores/auth.store";

import { API_URL } from "../../constants/api";
import {
  normalizarCurp,
  validarCoherenciaCurp,
  validarPasoAccesoDetallado,
  validarPasoDatosPersonalesDetallado,
  type ErroresPaso,
} from "../../lib/validacionRegistro";

function RequisitoContra({
  cumple,
  texto,
}: {
  cumple: boolean;
  texto: string;
}): React.JSX.Element {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={cumple ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={cumple ? COLORES.exito : COLORES.textoMuted}
      />
      <Text
        style={[
          styles.reqTexto,
          { color: cumple ? COLORES.exito : COLORES.textoMuted },
        ]}
      >
        {texto}
      </Text>
    </View>
  );
}

export default function RegistroScreen() {
  const [paso, setPaso] = useState(1);

  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [fecha, setFecha] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [genero, setGenero] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [curp, setCurp] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [avisoPrivacidad, setAvisoPrivacidad] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [erroresP1, setErroresP1] = useState<ErroresPaso>({});
  const [erroresP2, setErroresP2] = useState<ErroresPaso>({});
  const [errorCurpCoherencia, setErrorCurpCoherencia] = useState<
    string | null
  >(null);

  const seleccionarFecha = (event: any, fechaSeleccionada?: Date) => {
    setMostrarCalendario(false);

    if (fechaSeleccionada) {
      setFecha(fechaSeleccionada);
      const dia = fechaSeleccionada.getDate().toString().padStart(2, "0");
      const mes = (fechaSeleccionada.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const anio = fechaSeleccionada.getFullYear();

      setFechaNacimiento(`${dia}/${mes}/${anio}`);
    }
  };

  const handleRegistro = async () => {
    const errP1 = validarPasoDatosPersonalesDetallado({
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      genero,
      curp,
    });
    const tieneErrorP1 = Object.values(errP1).some(Boolean);
    setErroresP1(errP1);

    if (tieneErrorP1) {
      setPaso(1);
      return;
    }

    const errCurp = validarCoherenciaCurp({
      curp,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
    });
    setErrorCurpCoherencia(errCurp);
    if (errCurp) {
      setPaso(1);
      return;
    }

    const errP2 = validarPasoAccesoDetallado({
      telefono,
      correo,
      contrasena,
      confirmarContrasena,
    });
    const tieneErrorP2 = Object.values(errP2).some(Boolean);
    setErroresP2(errP2);

    if (tieneErrorP2) {
      setPaso(2);
      return;
    }

    if (!avisoPrivacidad || !consentimiento) {
      Alert.alert("Atención", "Debes aceptar los términos para continuar.");
      return;
    }

    const partesFecha = fechaNacimiento.split("/");
    const fechaNac = `${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]}`;

    try {
      const response = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombres.trim(),
          apellido_pat: apellidoPaterno.trim(),
          apellido_mat: apellidoMaterno.trim(),
          correoElectronico: correo.trim().toLowerCase(),
          telefono: telefono.replace(/\D/g, ""),
          fechaNacimiento: fechaNac,
          genero: genero.trim().toUpperCase(),
          curp: normalizarCurp(curp),
          password: contrasena,
        }),
      });

      let datos: Record<string, unknown> = {};
      try {
        datos = (await response.json()) as Record<string, unknown>;
      } catch {
        /* no JSON */
      }

      if (
        response.ok &&
        datos.access_token &&
        datos.refresh_token &&
        datos.usuario
      ) {
        await setAuth(
          datos.usuario as Usuario,
          String(datos.access_token),
          String(datos.refresh_token),
        );
        setPaso(4);
      } else {
        const raw = datos.message ?? datos.error ?? "No se pudo registrar";
        const mensaje = Array.isArray(raw) ? raw.join("\n") : String(raw);
        Alert.alert("No se pudo registrar", mensaje);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu red.",
      );
    }
  };

  const avanzarPaso = (): void => {
    if (paso === 1) {
      const err = validarPasoDatosPersonalesDetallado({
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento,
        genero,
        curp,
      });
      setErroresP1(err);
      const tieneError = Object.values(err).some(Boolean);
      if (tieneError) return;

      const errCurp = validarCoherenciaCurp({
        curp,
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento,
      });
      setErrorCurpCoherencia(errCurp);
      if (errCurp) return;
    }
    if (paso === 2) {
      const err = validarPasoAccesoDetallado({
        telefono,
        correo,
        contrasena,
        confirmarContrasena,
      });
      setErroresP2(err);
      const tieneError = Object.values(err).some(Boolean);
      if (tieneError) return;
    }
    setPaso((p) => p + 1);
  };

  const retrocederPaso = (): void => {
    setPaso((p) => Math.max(1, p - 1));
  };

  const finalizarRegistro = () => router.replace("/(privado)/inicio");

  const reqsContra = useMemo(
    () => [
      { cumple: contrasena.length >= 8, texto: "Mínimo 8 caracteres" },
      {
        cumple: /(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])/.test(contrasena),
        texto: "Al menos una letra",
      },
      { cumple: /(?=.*\d)/.test(contrasena), texto: "Al menos un número" },
    ],
    [contrasena],
  );

  const IndicadorPasos = () => (
    <View style={styles.contenedorIndicador}>
      {[1, 2, 3].map((num) => (
        <View
          key={num}
          style={[styles.lineaPaso, paso === num && styles.lineaPasoActiva]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.areaSegura}>
      <ScrollView contentContainerStyle={styles.contenedorScroll}>
        {paso < 4 && (
          <View style={styles.encabezado}>
            <Image
              source={require("../../assets/logo-medly-oficial.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tituloPaso}>
              {paso === 1
                ? "DATOS PERSONALES"
                : paso === 2
                  ? "DATOS DE ACCESO"
                  : "ASPECTOS LEGALES"}
            </Text>
            <IndicadorPasos />
          </View>
        )}

        {/* PASO 1: DATOS PERSONALES */}
        {paso === 1 && (
          <View style={styles.formulario}>
            <Entrada
              etiqueta="NOMBRES"
              placeholder="Nombres"
              value={nombres}
              onChangeText={(t) => {
                setNombres(t);
                setErroresP1((p) => ({ ...p, nombres: null }));
              }}
              mensajeError={erroresP1.nombres ?? undefined}
            />
            <Entrada
              etiqueta="APELLIDO PATERNO (obligatorio)"
              placeholder="Apellido Paterno"
              value={apellidoPaterno}
              onChangeText={(t) => {
                setApellidoPaterno(t);
                setErroresP1((p) => ({ ...p, apellidoPaterno: null }));
              }}
              mensajeError={erroresP1.apellidoPaterno ?? undefined}
            />
            <Entrada
              etiqueta="APELLIDO MATERNO"
              placeholder="Apellido materno"
              value={apellidoMaterno}
              onChangeText={(t) => {
                setApellidoMaterno(t);
                setErroresP1((p) => ({ ...p, apellidoMaterno: null }));
              }}
              mensajeError={erroresP1.apellidoMaterno ?? undefined}
            />
            <Entrada
              etiqueta="CURP"
              placeholder="18 caracteres alfanuméricos"
              value={curp}
              onChangeText={(t) => {
                setCurp(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18));
                setErroresP1((p) => ({ ...p, curp: null }));
                setErrorCurpCoherencia(null);
              }}
              maxLength={18}
              autoCapitalize="characters"
              mensajeError={erroresP1.curp ?? errorCurpCoherencia ?? undefined}
            />

            <View style={styles.fila}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <TouchableOpacity onPress={() => setMostrarCalendario(true)}>
                  <View pointerEvents="none">
                    <Entrada
                      etiqueta="NACIMIENTO"
                      placeholder="AAAA/MM/DD"
                      icono="calendar-outline"
                      value={fechaNacimiento}
                      editable={false}
                      onChangeText={setFechaNacimiento}
                      mensajeError={erroresP1.fechaNacimiento ?? undefined}
                    />
                  </View>
                </TouchableOpacity>
                {mostrarCalendario && (
                  <DateTimePicker
                    value={fecha}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={seleccionarFecha}
                  />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.etiqueta}>GÉNERO</Text>
                <View style={styles.contenedorGenero}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.tarjetaGenero,
                      genero === "H" && styles.tarjetaGeneroActiva,
                    ]}
                    onPress={() => {
                      setGenero("H");
                      setErroresP1((p) => ({ ...p, genero: null }));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Hombre"
                    accessibilityState={{ selected: genero === "H" }}
                  >
                    <Text
                      style={[
                        styles.generoLetra,
                        genero === "H" && styles.generoLetraActiva,
                      ]}
                    >
                      H
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.tarjetaGenero,
                      genero === "M" && styles.tarjetaGeneroActiva,
                    ]}
                    onPress={() => {
                      setGenero("M");
                      setErroresP1((p) => ({ ...p, genero: null }));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Mujer"
                    accessibilityState={{ selected: genero === "M" }}
                  >
                    <Text
                      style={[
                        styles.generoLetra,
                        genero === "M" && styles.generoLetraActiva,
                      ]}
                    >
                      M
                    </Text>
                  </TouchableOpacity>
                </View>
                {erroresP1.genero && (
                  <Text style={styles.errorTexto}>{erroresP1.genero}</Text>
                )}
              </View>
            </View>
            <Boton titulo="CONTINUAR →" alPresionar={avanzarPaso} />
          </View>
        )}

        {/* PASO 2: DATOS DE ACCESO */}
        {paso === 2 && (
          <View style={styles.formulario}>
            <Entrada
              etiqueta="NÚMERO DE TELÉFONO"
              placeholder="000-000-0000"
              icono="call-outline"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={(t) => {
                setTelefono(t);
                setErroresP2((p) => ({ ...p, telefono: null }));
              }}
              mensajeError={erroresP2.telefono ?? undefined}
            />
            <Entrada
              etiqueta="CORREO ELECTRÓNICO"
              placeholder="ejemplo@email.com"
              icono="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={(t) => {
                setCorreo(t);
                setErroresP2((p) => ({ ...p, correo: null }));
              }}
              mensajeError={erroresP2.correo ?? undefined}
            />
            <Entrada
              etiqueta="CONTRASEÑA"
              placeholder="Mínimo 8 caracteres"
              icono="lock-closed-outline"
              secureTextEntry
              value={contrasena}
              onChangeText={(t) => {
                setContrasena(t);
                setErroresP2((p) => ({ ...p, contrasena: null }));
              }}
              mensajeError={erroresP2.contrasena ?? undefined}
            />
            <View style={styles.reqsContainer}>
              {reqsContra.map((r) => (
                <RequisitoContra key={r.texto} cumple={r.cumple} texto={r.texto} />
              ))}
            </View>
            <Entrada
              etiqueta="CONFIRMAR CONTRASEÑA"
              placeholder="********"
              icono="lock-closed-outline"
              secureTextEntry
              value={confirmarContrasena}
              onChangeText={(t) => {
                setConfirmarContrasena(t);
                setErroresP2((p) => ({ ...p, confirmarContrasena: null }));
              }}
              mensajeError={erroresP2.confirmarContrasena ?? undefined}
            />

            <View style={styles.botonesPaso}>
              <TouchableOpacity
                style={styles.btnRegresar}
                onPress={retrocederPaso}
              >
                <Ionicons name="chevron-back" size={20} color={COLORES.texto} />
                <Text style={styles.btnRegresarTexto}>REGRESAR</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Boton titulo="CONTINUAR →" alPresionar={avanzarPaso} />
              </View>
            </View>
          </View>
        )}

        {/* PASO 3: ASPECTOS LEGALES */}
        {paso === 3 && (
          <View style={styles.formulario}>
            <TouchableOpacity
              style={styles.contenedorCheckbox}
              onPress={() => setAvisoPrivacidad(!avisoPrivacidad)}
            >
              <View
                style={[
                  styles.checkbox,
                  avisoPrivacidad && styles.checkboxActivo,
                ]}
              >
                {avisoPrivacidad && (
                  <Ionicons name="checkmark" size={16} color={COLORES.blanco} />
                )}
              </View>
              <Text style={styles.textoLegal}>
                He leído y acepto el{" "}
                <Text style={styles.enlaceLegal}>Aviso de Privacidad</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contenedorCheckbox}
              onPress={() => setConsentimiento(!consentimiento)}
            >
              <View
                style={[
                  styles.checkbox,
                  consentimiento && styles.checkboxActivo,
                ]}
              >
                {consentimiento && (
                  <Ionicons name="checkmark" size={16} color={COLORES.blanco} />
                )}
              </View>
              <Text style={styles.textoLegal}>
                Otorgo mi{" "}
                <Text style={styles.enlaceLegal}>Consentimiento informado</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.botonesPaso}>
              <TouchableOpacity
                style={styles.btnRegresar}
                onPress={retrocederPaso}
              >
                <Ionicons name="chevron-back" size={20} color={COLORES.texto} />
                <Text style={styles.btnRegresarTexto}>REGRESAR</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Boton titulo="FINALIZAR →" alPresionar={handleRegistro} />
              </View>
            </View>
          </View>
        )}

        {/* PASO 4: ÉXITO */}
        {paso === 4 && (
          <View style={styles.contenedorExito}>
            <View style={styles.circuloExito}>
              <Ionicons name="checkmark" size={60} color={COLORES.exito} />
            </View>
            <Text style={styles.tituloExito}>REGISTRO EXITOSO</Text>
            <Text style={styles.textoExito}>
              Tu registro se ha completado exitosamente, ya puedes agendar una
              cita
            </Text>

            <View style={{ width: "100%", marginTop: 40 }}>
              <Boton titulo="CONTINUAR →" alPresionar={finalizarRegistro} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenedorScroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  encabezado: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 50,
  },
  tituloPaso: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORES.texto,
    marginBottom: 10,
    letterSpacing: 1,
  },
  contenedorIndicador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  lineaPaso: {
    width: 25,
    height: 4,
    backgroundColor: COLORES.skyblue,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  lineaPasoActiva: {
    backgroundColor: COLORES.primario,
  },
  formulario: {
    width: "100%",
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 12,
    color: COLORES.texto,
    marginBottom: 8,
    fontWeight: "600",
  },
  contenedorGenero: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  tarjetaGenero: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: BORDES.radio,
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaGeneroActiva: {
    backgroundColor: COLORES.primario,
    borderColor: COLORES.primario,
  },
  generoLetra: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: COLORES.textoPlaceholder,
  },
  generoLetraActiva: {
    color: COLORES.blanco,
  },
  contenedorCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORES.skyblue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxActivo: {
    backgroundColor: COLORES.primario,
  },
  textoLegal: {
    fontSize: 14,
    color: COLORES.texto,
    flex: 1,
  },
  enlaceLegal: {
    color: COLORES.primario,
    fontWeight: "bold",
  },
  contenedorExito: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circuloExito: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORES.exito,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  tituloExito: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORES.texto,
    marginBottom: 12,
  },
  textoExito: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  errorTexto: {
    fontSize: 12,
    color: COLORES.peligro,
    marginTop: 4,
  },
  reqsContainer: {
    marginBottom: 16,
    marginTop: -8,
    paddingHorizontal: 4,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  reqTexto: {
    fontSize: 12,
    fontWeight: "500",
  },
  botonesPaso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  btnRegresar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  btnRegresarTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORES.texto,
  },
});
