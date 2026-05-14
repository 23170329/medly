import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";

import { API_URL } from "../../constants/api";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES } from "../../constants/theme";
import { useAuthStore, type Usuario } from "../../stores/auth.store";

export default function IniciarSesionScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const { setAuth } = useAuthStore();

  const manejarLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert("Atención", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correo.trim(),
          contrasena,
        }),
      });

      let datos: Record<string, unknown> = {};
      try {
        datos = (await response.json()) as Record<string, unknown>;
      } catch {
        /* cuerpo no JSON */
      }

      if (response.ok && datos.access_token && datos.refresh_token) {
        await setAuth(
          datos.usuario as Usuario,
          String(datos.access_token),
          String(datos.refresh_token),
        );

        router.replace("/(privado)/inicio");
      } else {
        const raw = datos.message ?? datos.error ?? "No se pudo iniciar sesión";
        const mensaje = Array.isArray(raw) ? raw.join("\n") : String(raw);
        Alert.alert("Error", mensaje);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Revisa tu red.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.areaSegura}>
      <View style={styles.contenedor}>
        {/* Logo y Encabezado */}
        <View style={styles.encabezado}>
          <Image
            source={require("../../assets/medlylogo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
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
  logo: {
    width: 120, // Ajusta este tamaño según veas en tu diseño
    height: 120, // Ajusta este tamaño
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
