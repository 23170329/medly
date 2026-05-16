import Constants from "expo-constants";

/**
 * URL base del API NestJS. Prioriza EXPO_PUBLIC_API_URL (.env del cliente);
 * si Expo sirve por LAN, usa la IP del bundler + puerto 3000.
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    // Si quedó copiado desde `.env.example` con IP de ejemplo, lo ignoramos
    // para permitir el modo dinámico (IP del Metro/packager).
    const looksLikeExample =
      fromEnv.includes("192.168.X.X") || fromEnv.includes("192.168.1.10");
    if (!looksLikeExample) {
      return fromEnv.replace(/\/$/, "");
    }
  }

  // En distintos entornos (Expo Go / dev client) la IP del packager puede vivir
  // en diferentes campos. Probamos varios y extraemos el host.
  const anyC = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest?: { debuggerHost?: string; hostUri?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const debuggerHost =
    anyC.expoConfig?.hostUri ??
    anyC.manifest2?.extra?.expoClient?.hostUri ??
    anyC.manifest?.hostUri ??
    anyC.manifest?.debuggerHost;

  if (debuggerHost) {
    // Ej: "192.168.1.55:8081" o "192.168.1.55:8081/--/..." → nos quedamos con host
    const host = debuggerHost.split("/")[0];
    const ip = host.split(":")[0];
    if (ip) return `http://${ip}:3000`;
  }

  return "http://localhost:3000";
}

export const API_URL = getApiUrl();
