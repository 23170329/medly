import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Entrada } from "../../componentes/comunes/Entrada";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../stores/auth.store";
import {
  normalizarCurp,
  validarPasoAcceso,
  validarPasoDatosPersonales,
} from "../../lib/validacionRegistro";

export default function RecepcionRegistrarPaciente(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [genero, setGenero] = useState("");
  const [curp, setCurp] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const enviar = async (): Promise<void> => {
    const err1 = validarPasoDatosPersonales({
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento: fechaNac,
      genero,
      curp,
    });
    if (err1) {
      Alert.alert("Revisa", err1);
      return;
    }
    const err2 = validarPasoAcceso({
      telefono,
      correo,
      contrasena,
      confirmarContrasena: confirmar,
    });
    if (err2) {
      Alert.alert("Revisa", err2);
      return;
    }
    const partes = fechaNac.split("/");
    if (partes.length !== 3) {
      Alert.alert("Fecha", "Usa formato DD/MM/AAAA");
      return;
    }
    const fechaNacimiento = `${partes[2]}-${partes[1]}-${partes[0]}`;
    try {
      const res = await fetch(`${API_URL}/recepcion/pacientes/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombres.trim(),
          apellido_pat: apellidoPaterno.trim(),
          apellido_mat: apellidoMaterno.trim(),
          correoElectronico: correo.trim().toLowerCase(),
          telefono: telefono.replace(/\D/g, ""),
          fechaNacimiento,
          genero: genero.trim().toUpperCase(),
          curp: normalizarCurp(curp),
          password: contrasena,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { mensaje?: string; message?: unknown };
      if (!res.ok) {
        const raw = data.message ?? "Error al registrar";
        Alert.alert("Error", Array.isArray(raw) ? raw.join("\n") : String(raw));
        return;
      }
      Alert.alert("Listo", data.mensaje ?? "Paciente registrado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <Text style={estilos.titulo}>Registro de paciente</Text>
        <Entrada etiqueta="NOMBRES" value={nombres} onChangeText={setNombres} />
        <Entrada
          etiqueta="APELLIDO PATERNO"
          value={apellidoPaterno}
          onChangeText={setApellidoPaterno}
        />
        <Entrada
          etiqueta="APELLIDO MATERNO (obligatorio)"
          value={apellidoMaterno}
          onChangeText={setApellidoMaterno}
        />
        <Entrada
          etiqueta="NACIMIENTO (DD/MM/AAAA)"
          value={fechaNac}
          onChangeText={setFechaNac}
        />
        <Entrada
          etiqueta="GÉNERO (H o M)"
          value={genero}
          onChangeText={(t) =>
            setGenero(
              t
                .trim()
                .toUpperCase()
                .replace(/[^HM]/g, "")
                .slice(0, 1),
            )
          }
        />
        <Entrada
          etiqueta="CURP"
          value={curp}
          onChangeText={(t) =>
            setCurp(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18))
          }
        />
        <Entrada etiqueta="TELÉFONO" value={telefono} onChangeText={setTelefono} />
        <Entrada
          etiqueta="CORREO"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
        />
        <Entrada
          etiqueta="CONTRASEÑA INICIAL"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
        />
        <Entrada
          etiqueta="CONFIRMAR CONTRASEÑA"
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
        />
        <Boton titulo="GUARDAR PACIENTE" alPresionar={() => void enviar()} />
        <TouchableOpacity style={estilos.back} onPress={() => router.back()}>
          <Text style={estilos.backTxt}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { padding: 24, paddingBottom: 48 },
  titulo: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    marginBottom: 20,
  },
  back: { marginTop: 20, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
