import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../../constants/theme";
import { useAuthStore } from "../../../stores/auth.store";

type TipoItem = "nav" | "switch" | "danger";

interface ItemMenu {
  readonly id: string;
  readonly icono: React.ComponentProps<typeof Ionicons>["name"];
  readonly etiqueta: string;
  readonly subtitulo?: string;
  readonly tipo: TipoItem;
  readonly onPress: () => void;
}

interface SeccionMenu {
  readonly titulo: string;
  readonly items: readonly ItemMenu[];
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
interface FilaMenuProps {
  readonly item: ItemMenu;
  readonly switchValue?: boolean;
}

function FilaMenu({ item, switchValue }: FilaMenuProps): React.JSX.Element {
  const esDanger = item.tipo === "danger";
  const colorIcono = esDanger ? paleta.red : paleta.navy;

  return (
    <TouchableOpacity
      style={estilos.fila}
      onPress={item.tipo !== "switch" ? item.onPress : undefined}
      activeOpacity={item.tipo === "switch" ? 1 : 0.65}
      accessibilityLabel={item.etiqueta}
      accessibilityRole={item.tipo === "switch" ? "switch" : "button"}
      accessibilityState={
        item.tipo === "switch" ? { checked: switchValue } : undefined
      }
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
        {item.subtitulo !== undefined && (
          <Text style={estilos.filaSub}>{item.subtitulo}</Text>
        )}
      </View>
      {item.tipo === "switch" ? (
        <Switch
          value={switchValue ?? false}
          onValueChange={item.onPress}
          trackColor={{ false: paleta.skyblue, true: paleta.teal }}
          thumbColor={paleta.white}
          accessibilityLabel={item.etiqueta}
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

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function PerfilPantalla(): React.JSX.Element {
  const { usuario, cerrarSesion } = useAuthStore();
  const [notificaciones, setNotificaciones] = useState<boolean>(true);

  // TODO: obtener estadísticas reales desde el store de citas
  const estadisticas = { total: 4, completadas: 2, proximas: 1 } as const;

  const inicialNombre: string = (
    usuario?.nombre?.charAt(0) ?? "U"
  ).toUpperCase();

  const nombreCompleto: string =
    usuario !== null ? `${usuario.nombre} ${usuario.apellido}` : "Cargando…";

  const handleCerrarSesion = (): void => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async (): Promise<void> => {
          await cerrarSesion();
          router.replace("/(auth)/iniciar-sesion");
        },
      },
    ]);
  };

  const SECCIONES: readonly SeccionMenu[] = [
    {
      titulo: "MI CUENTA",
      items: [
        {
          id: "editar",
          icono: "create-outline",
          etiqueta: "Editar perfil",
          subtitulo: "Nombre, teléfono y foto",
          tipo: "nav",
          onPress: () => router.push("/(privado)/perfil/editar"),
        },
        {
          id: "seguridad",
          icono: "lock-closed-outline",
          etiqueta: "Seguridad",
          subtitulo: "Cambiar contraseña",
          tipo: "nav",
          onPress: () => {
            /* TODO: navegar a cambio de contraseña */
          },
        },
      ],
    },
    {
      titulo: "PREFERENCIAS",
      items: [
        {
          id: "notif",
          icono: "notifications-outline",
          etiqueta: "Notificaciones",
          subtitulo: "Recordatorios de citas",
          tipo: "switch",
          onPress: () => setNotificaciones((v) => !v),
        },
        {
          id: "idioma",
          icono: "language-outline",
          etiqueta: "Idioma",
          subtitulo: "Español",
          tipo: "nav",
          onPress: () => {
            /* TODO */
          },
        },
      ],
    },
    {
      titulo: "INFORMACIÓN",
      items: [
        {
          id: "historial",
          icono: "document-text-outline",
          etiqueta: "Historial médico",
          subtitulo: "Consultas anteriores",
          tipo: "nav",
          onPress: () => {
            /* TODO */
          },
        },
        {
          id: "pagos",
          icono: "card-outline",
          etiqueta: "Métodos de pago",
          subtitulo: "Gestionar tarjetas",
          tipo: "nav",
          onPress: () => {
            /* TODO */
          },
        },
        {
          id: "ayuda",
          icono: "help-circle-outline",
          etiqueta: "Ayuda y soporte",
          subtitulo: "Chat, FAQ y contacto",
          tipo: "nav",
          onPress: () => {
            /* TODO */
          },
        },
      ],
    },
    {
      titulo: "LEGAL",
      items: [
        {
          id: "privacidad",
          icono: "shield-outline",
          etiqueta: "Aviso de privacidad",
          tipo: "nav",
          onPress: () => {
            /* TODO */
          },
        },
        {
          id: "terminos",
          icono: "document-outline",
          etiqueta: "Términos y condiciones",
          tipo: "nav",
          onPress: () => {
            /* TODO */
          },
        },
      ],
    },
  ] as const;

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* */}
        <Text style={estilos.titulo}>MI PERFIL</Text>

        {/* */}
        <View style={estilos.tarjetaUsuario}>
          <View style={estilos.avatarGrande}>
            <Text style={estilos.avatarLetra}>{inicialNombre}</Text>
          </View>
          <View style={estilos.usuarioInfo}>
            <Text style={estilos.usuarioNombre}>{nombreCompleto}</Text>
            <Text style={estilos.usuarioEmail}>{usuario?.email ?? ""}</Text>
            <View style={estilos.rolBadge}>
              <Ionicons
                name="person-circle-outline"
                size={12}
                color={paleta.teal}
              />
              <Text style={estilos.rolTexto}>{usuario?.rol ?? "PACIENTE"}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(privado)/perfil/editar")}
            style={estilos.editarBtn}
            accessibilityLabel="Editar perfil"
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={20} color={paleta.teal} />
          </TouchableOpacity>
        </View>

        {/* */}
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

        {/* */}
        {SECCIONES.map((seccion) => (
          <View key={seccion.titulo} style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>{seccion.titulo}</Text>
            <View style={estilos.seccionCard}>
              {seccion.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <FilaMenu
                    item={item}
                    switchValue={
                      item.id === "notif" ? notificaciones : undefined
                    }
                  />
                  {idx < seccion.items.length - 1 && (
                    <View style={estilos.itemDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* */}
        <TouchableOpacity
          style={estilos.btnCerrarSesion}
          onPress={handleCerrarSesion}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={paleta.red} />
          <Text style={estilos.btnCerrarSesionTexto}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text style={estilos.version}>Medly v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: COLORES.fondo },
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
    shadowColor: paleta.navy,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "700", color: paleta.navy },
  statLabel: {
    fontSize: 11,
    color: paleta.teal,
    marginTop: 2,
    textAlign: "center",
  },
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
    shadowColor: paleta.navy,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
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
    borderWidth: 1.5,
    borderColor: paleta.red,
    borderRadius: BORDES.radio,
    paddingVertical: 14,
    marginBottom: 20,
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
