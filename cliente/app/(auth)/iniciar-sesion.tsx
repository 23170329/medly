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

import { Link } from "expo-router";
import api from "../../lib/apiCliente";
import { Ionicons } from "@expo/vector-icons";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES } from "../../constants/theme";
import { useAuthStore, type Usuario } from "../../stores/auth.store";
import { redirigirTrasLogin } from "../../lib/rutasAuth";
import { normalizarIdentificadorLogin } from "../../lib/identificadorLogin";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  usuario: Usuario;
};

function mensajeDeError(error: unknown): string {
  const err = error as {
    response?: {
      status?: number;
      data?: { message?: string | string[]; error?: string };
    };
    message?: string;
  };
  const raw =
    err.response?.data?.message ??
    err.response?.data?.error ??
    err.message ??
    "No se pudo iniciar sesión";
  let mensaje = Array.isArray(raw) ? raw.join("\n") : String(raw);

  if (mensaje.includes("must be an email") || mensaje.includes("correo must be an email")) {
    return "El servidor aún no acepta CURP en login. Usa tu correo o redespliega el API.";
  }
  if (mensaje.includes("Cannot POST")) {
    return "No se encontró el servicio de login. Revisa EXPO_PUBLIC_API_URL (debe terminar en /api/v1) y reinicia con npx expo start -c.";
  }
  if (err.response?.status === 401) {
    return "Correo, CURP o teléfono incorrectos, o contraseña incorrecta.";
  }
  if (err.response?.status === 429) {
    return "Demasiados intentos. Espera un minuto e inténtalo de nuevo.";
  }
  return mensaje;
}

export default function IniciarSesionScreen() {
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { setAuth } = useAuthStore();

  const manejarLogin = async () => {
    if (!identificador || !contrasena) {
      Alert.alert("Atención", "Por favor ingresa tu correo, CURP o teléfono y contraseña.");
      return;
    }

    const id = normalizarIdentificadorLogin(identificador);
    if (!id) {
      Alert.alert("Atención", "Ingresa un correo, CURP o teléfono válido.");
      return;
    }

    setEnviando(true);
    try {
      let datos: LoginResponse | null = null;
      const rutas: { path: string; body: Record<string, string> }[] = [
        { path: "/auth/ingreso", body: { identificador: id, contrasena } },
        { path: "/auth/login", body: { correo: id, contrasena } },
      ];

      for (const { path, body } of rutas) {
        try {
          const { data } = await api.post<LoginResponse>(path, body);
          if (data.access_token && data.refresh_token) {
            datos = data;
            break;
          }
        } catch (e: unknown) {
          const st = (e as { response?: { status?: number } }).response?.status;
          if (st === 404) continue;
          throw e;
        }
      }

      if (!datos) {
        Alert.alert("Error", "No se pudo conectar con el servicio de inicio de sesión.");
        return;
      }

      await setAuth(datos.usuario, datos.access_token, datos.refresh_token);
      const usuario = useAuthStore.getState().usuario;
      if (usuario) redirigirTrasLogin(usuario, id);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (!err.response) {
        Alert.alert(
          "Error de conexión",
          "No se pudo conectar con el servidor. Revisa tu red y que el API esté en línea.",
        );
        return;
      }
      Alert.alert("Error", mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.areaSegura}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Image
            source={require("../../assets/logo-medly-oficial.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titulo}>Bienvenido</Text>
          <Text style={styles.subtitulo}>
            Ingresa tus credenciales para continuar.
          </Text>
        </View>

        <View style={styles.formulario}>
          <Entrada
            etiqueta="Correo, CURP o Teléfono"
            icono="person-outline"
            placeholder="Correo, CURP o teléfono (10 dígitos)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            value={identificador}
            onChangeText={setIdentificador}
          />

          <Entrada
            etiqueta="Contraseña"
            icono="lock-closed-outline"
            placeholder="Minimo 8 caracteres"
            permitirVerContrasena
            value={contrasena}
            onChangeText={setContrasena}
          />

          <TouchableOpacity style={styles.olvideContrasena}>
            <Text style={styles.textoOlvide}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <Boton
            titulo={enviando ? "Ingresando…" : "Iniciar Sesión"}
            alPresionar={manejarLogin}
          />
        </View>

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
    width: 120,
    height: 120,
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
