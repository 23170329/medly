import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";
import { useAuthStore } from "../../stores/auth.store";
import { useFocusEffect } from "@react-navigation/native";
import { fetchEstadisticasPerfil } from "../../lib/medlyApi";

type TipoItem = "nav" | "switch" | "danger";

export interface ItemPerfil {
  readonly id: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly etiqueta: string;
  readonly subtitulo?: string;
  readonly tipo: TipoItem;
  readonly onPress: () => void;
}

interface PerfilContenidoProps {
  readonly mostrarEstadisticas?: boolean;
  readonly onEditar?: () => void;
  readonly itemsExtra?: readonly ItemPerfil[];
}

function FilaMenu({
  item,
  switchValue,
}: {
  item: ItemPerfil;
  switchValue?: boolean;
}): React.JSX.Element {
  const esDanger = item.tipo === "danger";
  const colorIcono = esDanger ? paleta.red : paleta.navy;

  return (
    <TouchableOpacity
      style={estilos.fila}
      onPress={item.tipo !== "switch" ? item.onPress : undefined}
      activeOpacity={item.tipo === "switch" ? 1 : 0.65}
    >
      <View
        style={[
          estilos.filaIcono,
          { backgroundColor: esDanger ? "#FDE8E8" : paleta.skyblue },
        ]}
      >
        <Ionicons name={item.icono} size={19} color={colorIcono} />
      </View>
      <View style={estilos.filaTextos}>
        <Text style={[estilos.filaEtiqueta, esDanger && { color: paleta.red }]}>
          {item.etiqueta}
        </Text>
        {item.subtitulo != null && (
          <Text style={estilos.filaSub}>{item.subtitulo}</Text>
        )}
      </View>
      {item.tipo === "switch" ? (
        <Switch
          value={switchValue ?? false}
          onValueChange={item.onPress}
          trackColor={{ false: paleta.skyblue, true: paleta.teal }}
          thumbColor={paleta.white}
        />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={17}
          color={esDanger ? paleta.red : paleta.teal}
        />
      )}
    </TouchableOpacity>
  );
}

export function PerfilContenido({
  mostrarEstadisticas = false,
  onEditar,
  itemsExtra = [],
}: PerfilContenidoProps): React.JSX.Element {
  const { usuario, cerrarSesion } = useAuthStore();
  const [notificaciones, setNotificaciones] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    completadas: 0,
    proximas: 0,
  });

  const cargarStats = useCallback(async () => {
    if (!mostrarEstadisticas) return;
    try {
      const s = await fetchEstadisticasPerfil();
      setEstadisticas(s);
    } catch {
      setEstadisticas({ total: 0, completadas: 0, proximas: 0 });
    }
  }, [mostrarEstadisticas]);

  useFocusEffect(
    useCallback(() => {
      void cargarStats();
    }, [cargarStats]),
  );

  const inicialNombre = (usuario?.nombre?.charAt(0) ?? "U").toUpperCase();
  const nombreCompleto =
    usuario != null
      ? `${usuario.nombre} ${usuario.apellido ?? ""}`.trim()
      : "Cargando…";
  const rolTexto = usuario?.rol ?? "USUARIO";

  const handleCerrarSesion = (): void => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await cerrarSesion();
          router.replace("/(auth)/iniciar-sesion");
        },
      },
    ]);
  };

  const itemsBase: ItemPerfil[] = [
    {
      id: "info",
      icono: "person-outline",
      etiqueta: "Información Personal",
      subtitulo: "Nombre, apellidos, teléfono y correo",
      tipo: "nav",
      onPress:
        onEditar ??
        (() =>
          Alert.alert(
            "Información personal",
            "La edición de datos estará disponible pronto.",
          )),
    },
    {
      id: "notif",
      icono: "notifications-outline",
      etiqueta: "Notificaciones",
      subtitulo: "Recordatorios de citas",
      tipo: "switch",
      onPress: () => setNotificaciones((v) => !v),
    },
    {
      id: "seg",
      icono: "lock-closed-outline",
      etiqueta: "Seguridad",
      subtitulo: "Contraseña de acceso",
      tipo: "nav",
      onPress: () =>
        Alert.alert(
          "Seguridad",
          "Próximamente podrás cambiar tu contraseña desde la app.",
        ),
    },
    {
      id: "ayuda",
      icono: "help-circle-outline",
      etiqueta: "Centro de Ayuda",
      subtitulo: "Preguntas frecuentes",
      tipo: "nav",
      onPress: () => Alert.alert("Ayuda", "Soporte: contacto@medly.mx"),
    },
    {
      id: "legal",
      icono: "document-text-outline",
      etiqueta: "Legal",
      subtitulo: "Términos, privacidad y cookies",
      tipo: "nav",
      onPress: () => Alert.alert("Legal", "Términos y aviso de privacidad."),
    },
    ...itemsExtra,
  ];

  return (
    <ScrollView
      contentContainerStyle={estilos.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={estilos.titulo}>PERFIL</Text>

      <View style={estilos.tarjetaUsuario}>
        <View style={estilos.avatarGrande}>
          <Text style={estilos.avatarLetra}>{inicialNombre}</Text>
        </View>
        <View style={estilos.usuarioInfo}>
          <Text style={estilos.usuarioNombre}>{nombreCompleto}</Text>
          <Text style={estilos.usuarioEmail}>{usuario?.email ?? ""}</Text>
          <View style={estilos.rolBadge}>
            <Ionicons name="person-circle-outline" size={12} color={paleta.teal} />
            <Text style={estilos.rolTexto}>{rolTexto}</Text>
          </View>
        </View>
        {onEditar != null && (
          <TouchableOpacity onPress={onEditar} style={estilos.editarBtn}>
            <Ionicons name="create-outline" size={20} color={paleta.teal} />
          </TouchableOpacity>
        )}
      </View>

      {mostrarEstadisticas && (
        <View style={estilos.statsRow}>
          {[
            { num: estadisticas.total, label: "Total" },
            { num: estadisticas.completadas, label: "Completadas" },
            { num: estadisticas.proximas, label: "Próximas" },
          ].map((s, idx) => (
            <React.Fragment key={s.label}>
              {idx > 0 && <View style={estilos.statDivider} />}
              <View style={estilos.statItem}>
                <Text style={estilos.statNum}>{s.num}</Text>
                <Text style={estilos.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}

      <View style={estilos.seccion}>
        <Text style={estilos.seccionTitulo}>AJUSTES</Text>
        <View style={estilos.seccionCard}>
          {itemsBase.map((item, idx) => (
            <React.Fragment key={item.id}>
              <FilaMenu
                item={item}
                switchValue={item.id === "notif" ? notificaciones : undefined}
              />
              {idx < itemsBase.length - 1 && <View style={estilos.itemDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <TouchableOpacity style={estilos.btnCerrarSesion} onPress={handleCerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color={paleta.red} />
        <Text style={estilos.btnCerrarSesionTexto}>CERRAR SESIÓN</Text>
      </TouchableOpacity>

      <Text style={estilos.version}>Medly v1.0.0</Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 48 },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: paleta.navy,
    letterSpacing: 1,
    marginBottom: 20,
    marginTop: 8,
  },
  tarjetaUsuario: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio + 4,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: paleta.navy,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarGrande: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: paleta.navy,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarLetra: { fontSize: 24, fontWeight: "700", color: paleta.white },
  usuarioInfo: { flex: 1 },
  usuarioNombre: { fontSize: 16, fontWeight: "700", color: paleta.navy },
  usuarioEmail: { fontSize: 13, color: paleta.teal, marginTop: 2 },
  rolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: paleta.skyblue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  rolTexto: { fontSize: 11, fontWeight: "600", color: paleta.teal },
  editarBtn: { padding: 8 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "700", color: paleta.navy },
  statLabel: { fontSize: 11, color: paleta.teal, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: paleta.skyblue },
  seccion: { marginBottom: 20 },
  seccionTitulo: {
    fontSize: 10,
    fontWeight: "700",
    color: paleta.teal,
    letterSpacing: 1.4,
    marginBottom: 8,
    marginLeft: 4,
  },
  seccionCard: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    overflow: "hidden",
    elevation: 1,
  },
  fila: { flexDirection: "row", alignItems: "center", padding: 14 },
  filaIcono: {
    width: 36,
    height: 36,
    borderRadius: BORDES.radio,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  filaTextos: { flex: 1 },
  filaEtiqueta: { fontSize: 14, fontWeight: "600", color: paleta.navy },
  filaSub: { fontSize: 12, color: paleta.teal, marginTop: 1 },
  itemDivider: { height: 1, backgroundColor: COLORES.fondo, marginLeft: 62 },
  btnCerrarSesion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: paleta.red,
    borderRadius: BORDES.radioPill,
    paddingVertical: 16,
    marginBottom: 20,
    backgroundColor: paleta.white,
  },
  btnCerrarSesionTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: paleta.red,
    letterSpacing: 0.5,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: paleta.teal,
    opacity: 0.4,
  },
});
