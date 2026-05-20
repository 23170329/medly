import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const paleta = {
  navy: "#2F4156",
  teal: "#567C8D",
  /** Barra superior tipo mockup (slate) */
  headerBar: "#3D5266",
  skyblue: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF",
  red: "#E63946",
  green: "#4CAF50",
  yellow: "#F1C40F",
  yellowSoft: "#FEF9E7",
  /** Texto sobre aviso */
  yellowText: "#92400E",
} as const;

export const AppTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: paleta.navy,
    onPrimary: paleta.white,
    primaryContainer: paleta.navy,
    onPrimaryContainer: paleta.beige,
    secondary: paleta.teal,
    onSecondary: paleta.white,
    secondaryContainer: paleta.teal,
    onSecondaryContainer: paleta.navy,
    tertiary: paleta.beige,
    onTertiary: paleta.navy,
    background: paleta.beige,
    onBackground: paleta.navy,
    surface: paleta.white,
    onSurface: paleta.navy,
    surfaceVariant: paleta.beige,
    onSurfaceVariant: paleta.navy,
    error: paleta.red,
    onError: paleta.white,
    outline: paleta.navy,
  },
};

export const COLORES = {
  primario: AppTheme.colors.primary,
  fondo: AppTheme.colors.background,
  exito: paleta.green,
  alerta: paleta.yellow,
  peligro: AppTheme.colors.error,
  error: AppTheme.colors.error,
  texto: AppTheme.colors.onSurface,
  textoMuted: "#9CA3AF",
  blanco: paleta.white,
  skyblue: paleta.skyblue,
  grisClaro: paleta.skyblue,
} as const;

export const BORDES = {
  radio: 12,
  /** Botones tipo píldora del mockup */
  radioPill: 28,
};
