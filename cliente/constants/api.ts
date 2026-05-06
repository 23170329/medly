import Constants from "expo-constants";

export const getApiUrl = () => {
  // 1. Extrae la IP dinámica de quien esté corriendo el servidor de Expo
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(":").shift();
    return `http://${ip}:3000`;
  }

  // 2. Fallback de seguridad
  return "http://localhost:3000";
};

export const API_URL = getApiUrl();
