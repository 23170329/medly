import { MD3LightTheme, type MD3Theme } from "react-native-paper";

const paleta = {
  navy: "#2F4156",
  teal: "#567C8D",
  skyblue: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF",
  red: "#E53E3E",
  green: "#38A169",
  yellow: "#ECC94B",
};

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

// medly/cliente/constants/theme.ts
export const COLORES = {
  primario: "#456B75", // El azul oscuro/verdoso de los encabezados y botones principales
  fondo: "#F8F4F0", // El color crema de fondo de la app
  exito: "#28A745", // Verde para los check de "Registro Exitoso"
  alerta: "#FFC107", // Amarillo para "Esperando Pago"
  peligro: "#DC3545", // Rojo para "Cancelar Cita"
  texto: "#333333",
  blanco: "#FFFFFF",
  grisClaro: "#E0E0E0",
};

export const BORDES = {
  radio: 12, // El redondeo que tienen casi todas tus tarjetas y botones
};

export { paleta };
