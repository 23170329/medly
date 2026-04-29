import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES } from "../../constants/theme";

export default function IniciarSesionScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarLogin = () => {
    // Aquí luego conectaremos con tu backend en NestJS
    console.log("Intentando iniciar sesión con:", correo);

    // Simulamos que el login es exitoso y lo mandamos al inicio temporal
    router.replace("/(privado)/inicio");
  };

  return (
    <SafeAreaView style={styles.areaSegura}>
      <View style={styles.contenedor}>
        {/* Logo y Encabezado */}
        <View style={styles.encabezado}>
          <View style={styles.circuloLogo}>
            <Ionicons name="medical" size={40} color={COLORES.blanco} />
          </View>
          <Text style={styles.titulo}>Bienvenido</Text>
          <Text style={styles.subtitulo}>
            Ingresa tus credenciales para continuar.
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.formulario}>
          <Entrada
            etiqueta="Correo Electrónico"
            icono="mail-outline"
            placeholder="ejemplo@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
          />

          <Entrada
            etiqueta="Contraseña"
            icono="lock-closed-outline"
            placeholder="Minimo 8 caracteres"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
          />

          <TouchableOpacity style={styles.olvideContrasena}>
            <Text style={styles.textoOlvide}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <Boton titulo="Iniciar Sesión" alPresionar={manejarLogin} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.textoFooter}>¿No tienes cuenta? </Text>
          <Link href="/(auth)/registro" asChild>
            <TouchableOpacity>
              <Text style={styles.enlaceRegistro}>Regístrate</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  encabezado: {
    alignItems: "center",
    marginBottom: 40,
  },
  circuloLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8AB4F8", // Un azul clarito parecido a tu diseño
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.texto,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: "#666",
  },
  formulario: {
    width: "100%",
  },
  olvideContrasena: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  textoOlvide: {
    fontSize: 12,
    color: COLORES.texto,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  textoFooter: {
    color: COLORES.texto,
    fontSize: 14,
  },
  enlaceRegistro: {
    color: COLORES.primario,
    fontSize: 14,
    fontWeight: "bold",
  },
});
