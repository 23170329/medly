import React, { useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
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
    <View style={estilos.reqRow}>
      <Ionicons
        name={cumple ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={cumple ? COLORES.exito : COLORES.textoMuted}
      />
      <Text
        style={[
          estilos.reqTexto,
          { color: cumple ? COLORES.exito : COLORES.textoMuted },
        ]}
      >
        {texto}
      </Text>
    </View>
  );
}

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
  const [erroresP1, setErroresP1] = useState<ErroresPaso>({});
  const [erroresP2, setErroresP2] = useState<ErroresPaso>({});
  const [errorCurpCoherencia, setErrorCurpCoherencia] = useState<
    string | null
  >(null);

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

  const limpiarFormulario = (): void => {
    setNombres("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setFechaNac("");
    setGenero("");
    setCurp("");
    setTelefono("");
    setCorreo("");
    setContrasena("");
    setConfirmar("");
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

    const errP2 = validarPasoAccesoDetallado({
      telefono,
      correo,
      contrasena,
      confirmarContrasena: confirmar,
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
      limpiarFormulario();
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
        <Entrada
          etiqueta="CONTRASEÑA"
          placeholder="Mínimo 8 caracteres"
          icono="lock-closed-outline"
          permitirVerContrasena
          value={contrasena}
          onChangeText={(t) => {
            setContrasena(t);
            setErroresP2((p) => ({ ...p, contrasena: null }));
          }}
          mensajeError={erroresP2.contrasena ?? undefined}
        />
        <View style={estilos.reqsContainer}>
          {reqsContra.map((r) => (
            <RequisitoContra key={r.texto} cumple={r.cumple} texto={r.texto} />
          ))}
        </View>
        <Entrada
          etiqueta="CONFIRMAR CONTRASEÑA"
          placeholder="********"
          icono="lock-closed-outline"
          permitirVerContrasena
          value={confirmar}
          onChangeText={(t) => {
            setConfirmar(t);
            setErroresP2((p) => ({ ...p, confirmarContrasena: null }));
          }}
          mensajeError={erroresP2.confirmarContrasena ?? undefined}
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
    marginBottom: 16,
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
  back: { marginTop: 20, alignItems: "center" },
  backTxt: { color: paleta.teal, fontWeight: "600" },
});
