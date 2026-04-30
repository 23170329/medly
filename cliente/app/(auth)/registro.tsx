import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES } from "../../constants/theme";

export default function RegistroScreen() {
  const [paso, setPaso] = useState(1);

  // Estados para guardar la información del formulario
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [avisoPrivacidad, setAvisoPrivacidad] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);

  const avanzarPaso = () => setPaso(paso + 1);
  const finalizarRegistro = () => router.replace("/(auth)/iniciar-sesion");

  // Componente interno para el indicador de 3 rayitas
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
        {/* Cabecera dinámica: Muestra el logo y los pasos solo si no es la pantalla de éxito */}
        {paso < 4 && (
          <View style={styles.encabezado}>
            <Image
              source={require("../../assets/medlylogo.jpg")}
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

        {/* --- PASO 1: DATOS PERSONALES --- */}
        {paso === 1 && (
          <View style={styles.formulario}>
            <Entrada
              etiqueta="NOMBRES"
              placeholder="Nombres"
              value={nombres}
              onChangeText={setNombres}
            />
            <Entrada
              etiqueta="APELLIDO PATERNO"
              placeholder="Apellido Paterno"
              value={apellidoPaterno}
              onChangeText={setApellidoPaterno}
            />
            <Entrada
              etiqueta="APELLIDO MATERNO"
              placeholder="Apellido Materno"
              value={apellidoMaterno}
              onChangeText={setApellidoMaterno}
            />

            <View style={styles.fila}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Entrada
                  etiqueta="NACIMIENTO"
                  placeholder="DD/MM/AAAA"
                  icono="calendar-outline"
                  value={fechaNacimiento}
                  onChangeText={setFechaNacimiento}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.etiqueta}>GÉNERO</Text>
                <View style={styles.contenedorGenero}>
                  <TouchableOpacity
                    style={[
                      styles.botonGenero,
                      genero === "M" && styles.botonGeneroActivo,
                    ]}
                    onPress={() => setGenero("M")}
                  >
                    <Ionicons
                      name="male-outline"
                      size={24}
                      color={genero === "M" ? COLORES.blanco : COLORES.texto}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.botonGenero,
                      genero === "F" && styles.botonGeneroActivo,
                    ]}
                    onPress={() => setGenero("F")}
                  >
                    <Ionicons
                      name="female-outline"
                      size={24}
                      color={genero === "F" ? COLORES.blanco : COLORES.texto}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Boton titulo="CONTINUAR →" alPresionar={avanzarPaso} />
          </View>
        )}

        {/* --- PASO 2: DATOS DE ACCESO --- */}
        {paso === 2 && (
          <View style={styles.formulario}>
            <Entrada
              etiqueta="NÚMERO DE TELÉFONO"
              placeholder="000-000-0000"
              icono="call-outline"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
            />
            <Entrada
              etiqueta="CORREO ELECTRÓNICO"
              placeholder="ejemplo@email.com"
              icono="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={setCorreo}
            />
            <Entrada
              etiqueta="CONTRASEÑA"
              placeholder="Mínimo 8 caracteres"
              icono="lock-closed-outline"
              secureTextEntry
              value={contrasena}
              onChangeText={setContrasena}
            />
            <Entrada
              etiqueta="CONFIRMAR CONTRASEÑA"
              placeholder="********"
              icono="lock-closed-outline"
              secureTextEntry
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
            />

            <Boton titulo="CONTINUAR →" alPresionar={avanzarPaso} />
          </View>
        )}

        {/* --- PASO 3: ASPECTOS LEGALES --- */}
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

            <View style={{ marginTop: 40 }}>
              <Boton titulo="FINALIZAR →" alPresionar={avanzarPaso} />
            </View>
          </View>
        )}

        {/* --- PASO 4: ÉXITO --- */}
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
    borderRadius: 50, // Hace que la imagen se vea circular si es cuadrada
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
    backgroundColor: COLORES.grisClaro,
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
    justifyContent: "space-between",
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    height: 50,
  },
  botonGenero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  botonGeneroActivo: {
    backgroundColor: COLORES.primario,
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
    backgroundColor: COLORES.grisClaro,
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
});
