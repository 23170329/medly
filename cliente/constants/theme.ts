import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const paleta = {
  navy: "#2F4156",
  teal: "#567C8D",
  skyblue: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF",
  red: "#E53E3E",
  green: "#38A169",
  yellow: "#ECC94B",
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
  texto: AppTheme.colors.onSurface,
  blanco: paleta.white,
  skyblue: paleta.skyblue,
} as const;

export const BORDES = {
  radio: 12,
};

export { paleta };
