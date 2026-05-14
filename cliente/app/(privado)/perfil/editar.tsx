import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import {
  fetchPerfilPaciente,
  actualizarPerfilPaciente,
} from "../../../lib/medlyApi";
import { useAuthStore } from "../../../stores/auth.store";

export default function EditarPerfilPantalla(): React.JSX.Element {
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const usuario = useAuthStore((s) => s.usuario);

  const [nombre, setNombre] = useState("");
  const [apPat, setApPat] = useState("");
  const [apMat, setApMat] = useState("");
  const [tel, setTel] = useState("");
  const [mail, setMail] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const p = await fetchPerfilPaciente();
      setNombre(p.nombre);
      setApPat(p.apellido_pat);
      setApMat(p.apellido_mat ?? "");
      setTel(p.telefono);
      setMail(p.correoElectronico);
    } catch {
      Alert.alert("Error", "No se pudo cargar tu perfil.");
      router.back();
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const guardar = async (): Promise<void> => {
    if (!accessToken || !refreshToken || !usuario) return;
    setGuardando(true);
    try {
      const p = await actualizarPerfilPaciente({
        nombre: nombre.trim(),
        apellido_pat: apPat.trim(),
        apellido_mat: apMat.trim() || undefined,
        telefono: tel.trim(),
        correoElectronico: mail.trim().toLowerCase(),
      });
      const apellido = [p.apellido_pat, p.apellido_mat].filter(Boolean).join(" ");
      await setAuth(
        {
          ...usuario,
          nombre: p.nombre,
          apellido,
          email: p.correoElectronico,
        },
        accessToken,
        refreshToken,
      );
      Alert.alert("Listo", "Cambios guardados.");
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar. Revisa los datos.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={estilos.area}>
        <ActivityIndicator style={{ marginTop: 48 }} color={paleta.navy} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.area}>
      <View style={estilos.top}>
        <TouchableOpacity
          style={estilos.btnAtras}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={paleta.white} />
        </TouchableOpacity>
        <Text style={estilos.titulo}>INFORMACIÓN PERSONAL</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <Campo etiqueta="NOMBRE" value={nombre} onChangeText={setNombre} />
        <Campo etiqueta="APELLIDO PATERNO" value={apPat} onChangeText={setApPat} />
        <Campo etiqueta="APELLIDO MATERNO" value={apMat} onChangeText={setApMat} />
        <Campo
          etiqueta="TELÉFONO"
          value={tel}
          onChangeText={setTel}
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="CORREO ELECTRÓNICO"
          value={mail}
          onChangeText={setMail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={estilos.btnGuardar}
          onPress={() => void guardar()}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color={paleta.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={paleta.white} />
              <Text style={estilos.btnTxt}>GUARDAR CAMBIOS</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  etiqueta,
  ...rest
}: {
  etiqueta: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.lab}>{etiqueta}</Text>
      <TextInput style={estilos.inp} placeholderTextColor="#9CA3AF" {...rest} />
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORES.fondo },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  btnAtras: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 15,
    fontWeight: "800",
    color: paleta.navy,
    letterSpacing: 0.6,
    flex: 1,
  },
  scroll: { padding: 24, paddingBottom: 48 },
  campo: { marginBottom: 18 },
  lab: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    letterSpacing: 1,
    marginBottom: 8,
  },
  inp: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    color: paleta.navy,
  },
  btnGuardar: {
    marginTop: 28,
    backgroundColor: paleta.teal,
    borderRadius: BORDES.radioPill,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnTxt: {
    color: paleta.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
