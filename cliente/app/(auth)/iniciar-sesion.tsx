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
import {
  normalizarIdentificadorLogin,
  tipoIdentificadorLogin,
} from "../../lib/identificadorLogin";

export default function IniciarSesionScreen() {
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");

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
    const tipo = tipoIdentificadorLogin(id);

    const postLogin = async (
      ruta: string,
      cuerpo: Record<string, string>,
    ) => {
      const { data } = await api.post<{
        access_token: string;
        refresh_token: string;
        usuario: Usuario;
        message?: string | string[];
      }>(ruta, cuerpo);
      return data;
    };

    try {
      let datos: {
        access_token: string;
        refresh_token: string;
        usuario: Usuario;
      };
      try {
        datos = await postLogin("/auth/ingreso", {
          identificador: id,
          contrasena,
        });
      } catch (primero: unknown) {
        const st = (primero as { response?: { status?: number } }).response
          ?.status;
        if (st === 404 && tipo === "correo") {
          datos = await postLogin("/auth/login", { correo: id, contrasena });
        } else {
          throw primero;
        }
      }

      if (datos.access_token && datos.refresh_token) {
        await setAuth(datos.usuario, datos.access_token, datos.refresh_token);
        redirigirTrasLogin(datos.usuario, id);
        return;
      }
      Alert.alert("Error", "No se pudo iniciar sesión");
    } catch (error) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const raw =
        err.response?.data?.message ??
        err.response?.data?.error ??
        "No se pudo iniciar sesión";
      let mensaje = Array.isArray(raw) ? raw.join("\n") : String(raw);
      if (
        typeof mensaje === "string" &&
        (mensaje.includes("must be an email") ||
          mensaje.includes("correo must be an email"))
      ) {
        mensaje =
          "El servidor en Railway aún no tiene la actualización para CURP/teléfono. Entra con tu correo, o redespliega el API (carpeta servidor) y ejecuta npx expo start -c.";
      } else if (
        typeof mensaje === "string" &&
        mensaje.includes("Cannot POST") &&
        (mensaje.includes("/auth/ingreso") || mensaje.includes("/api/v1"))
      ) {
        mensaje =
          "Falta desplegar el API nuevo en Railway (ruta /auth/ingreso), o usa http://TU_IP:3000/api/v1 en cliente/.env con npm run start:dev en servidor.";
      } else if (
        typeof mensaje === "string" &&
        mensaje.includes("Cannot POST") &&
        mensaje.includes("/api/v1")
      ) {
        mensaje =
          "La URL del API no coincide con el servidor. En cliente/.env usa Railway sin /api/v1, o local con http://TU_IP:3000/api/v1.";
      }
      if (err.response) {
        Alert.alert("Error", mensaje);
        return;
      }
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
            source={require("../../assets/logo-medly-oficial.png")}
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
