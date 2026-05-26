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
import { EncabezadoPantallaMedico } from "../../componentes/medico/EncabezadoPantallaMedico";
import { Entrada } from "../../componentes/comunes/Entrada";
import { FechaNacimientoGenero } from "../../componentes/comunes/FechaNacimientoGenero";
import { Boton } from "../../componentes/comunes/Boton";
import { COLORES, paleta } from "../../constants/theme";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../stores/auth.store";
import {
  normalizarCurp,
  validarCoherenciaCurp,
  validarPasoAccesoRecepcionDetallado,
  validarPasoDatosPersonalesDetallado,
  type ErroresPaso,
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
  const [erroresP1, setErroresP1] = useState<ErroresPaso>({});
  const [erroresP2, setErroresP2] = useState<ErroresPaso>({});
  const [errorCurpCoherencia, setErrorCurpCoherencia] = useState<
    string | null
  >(null);

  const limpiarFormulario = (): void => {
    setNombres("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setFechaNac("");
    setGenero("");
    setCurp("");
    setTelefono("");
    setCorreo("");
    setErroresP1({});
    setErroresP2({});
    setErrorCurpCoherencia(null);
  };

  const enviar = async (): Promise<void> => {
    const errP1 = validarPasoDatosPersonalesDetallado({
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento: fechaNac,
      genero,
      curp,
    });
    setErroresP1(errP1);
    if (Object.values(errP1).some(Boolean)) return;

    const errCurp = validarCoherenciaCurp({
      curp,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento: fechaNac,
    });
    setErrorCurpCoherencia(errCurp);
    if (errCurp) return;

    const errP2 = validarPasoAccesoRecepcionDetallado({
      telefono,
      correo,
    });
    setErroresP2(errP2);
    if (Object.values(errP2).some(Boolean)) return;
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
          ...(apellidoMaterno.trim()
            ? { apellido_mat: apellidoMaterno.trim() }
            : {}),
          ...(correo.trim()
            ? { correoElectronico: correo.trim().toLowerCase() }
            : {}),
          telefono: telefono.replace(/\D/g, ""),
          fechaNacimiento,
          genero: genero.trim().toUpperCase(),
          curp: normalizarCurp(curp),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        mensaje?: string;
        message?: unknown;
      };
      if (!res.ok) {
        const raw = data.message ?? "Error al registrar";
        Alert.alert("Error", Array.isArray(raw) ? raw.join("\n") : String(raw));
        return;
      }
      limpiarFormulario();
      Alert.alert(
        "Paciente registrado",
        data.mensaje ??
          "El paciente se registró correctamente. Comunícale su contraseña temporal.",
        [
          {
            text: "Aceptar",
            onPress: () => router.replace("/(recepcion)"),
          },
        ],
      );
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
          placeholder="Apellido materno (opcional)"
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
          autoCapitalize="characters"
          maxLength={18}
          mensajeError={erroresP1.curp ?? errorCurpCoherencia ?? undefined}
        />
        <FechaNacimientoGenero
          fechaNacimiento={fechaNac}
          onFechaNacimientoChange={setFechaNac}
          genero={genero}
          onGeneroChange={(g) => {
            setGenero(g);
            setErroresP1((p) => ({ ...p, genero: null }));
          }}
          errorFecha={erroresP1.fechaNacimiento ?? undefined}
          errorGenero={erroresP1.genero ?? undefined}
          onFechaSeleccionada={() =>
            setErroresP1((p) => ({ ...p, fechaNacimiento: null }))
          }
        />
        <Text style={estilos.subtituloAcceso}>DATOS DE ACCESO</Text>
        <Text style={estilos.notaAcceso}>
          La contraseña se generará automáticamente con el primer nombre y la
          fecha de nacimiento del paciente.
        </Text>
        <Entrada
          etiqueta="NÚMERO DE TELÉFONO"
          placeholder="000-000-0000"
          icono="call-outline"
          value={telefono}
          onChangeText={(t) => {
            setTelefono(t.replace(/\D/g, "").slice(0, 10));
            setErroresP2((p) => ({ ...p, telefono: null }));
          }}
          keyboardType="phone-pad"
          inputMode="numeric"
          maxLength={10}
          mensajeError={erroresP2.telefono ?? undefined}
        />
        <Entrada
          etiqueta="CORREO ELECTRÓNICO (opcional)"
          placeholder="ejemplo@email.com (opcional)"
          icono="mail-outline"
          value={correo}
          onChangeText={(t) => {
            setCorreo(t);
            setErroresP2((p) => ({ ...p, correo: null }));
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          mensajeError={erroresP2.correo ?? undefined}
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
  subtituloAcceso: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: paleta.teal,
    marginTop: 8,
    marginBottom: 8,
  },
  notaAcceso: {
    fontSize: 12,
    color: COLORES.textoMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  back: { marginTop: 20, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
