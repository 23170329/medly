import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { EncabezadoPantallaMedico } from "../../componentes/medico/EncabezadoPantallaMedico";
import { Entrada } from "../../componentes/comunes/Entrada";
import { FechaNacimientoGenero } from "../../componentes/comunes/FechaNacimientoGenero";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../stores/auth.store";
import {
  normalizarCurp,
  validarCoherenciaCurp,
  validarPasoAccesoRecepcion,
  validarPasoDatosPersonales,
} from "../../lib/validacionRegistro";

export default function RecepcionRegistrarPaciente(): React.JSX.Element {
  const token = useAuthStore((s) => s.accessToken);
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [genero, setGenero] = useState<"" | "H" | "M">("");
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
    const errCurp = validarCoherenciaCurp({
      curp,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento: fechaNac,
    });
    if (errCurp) {
      Alert.alert("CURP", errCurp);
      return;
    }
    const err2 = validarPasoAccesoRecepcion({
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
          ...(correo.trim()
            ? { correoElectronico: correo.trim().toLowerCase() }
            : {}),
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
      router.replace("/(recepcion)/citas/exito");
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <EncabezadoPantallaMedico
          titulo="REGISTRAR PACIENTE"
          onAtras={() => router.back()}
        />
        <Text style={estilos.subtitulo}>ASIGNACIÓN DE DATOS PERSONALES</Text>
        <Entrada etiqueta="NOMBRES" value={nombres} onChangeText={setNombres} />
        <Entrada
          etiqueta="APELLIDO PATERNO"
          value={apellidoPaterno}
          onChangeText={setApellidoPaterno}
        />
        <Entrada
          etiqueta="APELLIDO MATERNO"
          value={apellidoMaterno}
          onChangeText={setApellidoMaterno}
        />
        <Entrada
          etiqueta="CURP (obligatorio)"
          placeholder="18 caracteres alfanuméricos"
          value={curp}
          onChangeText={(t) =>
            setCurp(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18))
          }
          autoCapitalize="characters"
          maxLength={18}
        />
        <FechaNacimientoGenero
          fechaNacimiento={fechaNac}
          onFechaNacimientoChange={setFechaNac}
          genero={genero}
          onGeneroChange={setGenero}
        />
        <Entrada
          etiqueta="TELÉFONO (obligatorio)"
          value={telefono}
          onChangeText={(t) => setTelefono(t.replace(/\D/g, "").slice(0, 10))}
          keyboardType="phone-pad"
          inputMode="numeric"
          maxLength={10}
        />
        <Entrada
          etiqueta="CORREO (opcional)"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="email-address"
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
  subtitulo: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: paleta.teal,
    marginBottom: 16,
  },
  back: { marginTop: 20, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
