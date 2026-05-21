import Constants from "expo-constants";

/**
 * URL base del API NestJS (siempre con `/api/v1`, sin barra final).
 * Ejemplo: https://medly-production.up.railway.app/api/v1
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    const looksLikeExample =
      fromEnv.includes("192.168.X.X") || fromEnv.includes("192.168.1.10");
    if (!looksLikeExample) {
      return asegurarPrefijoApi(fromEnv);
    }
  }

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
    const host = debuggerHost.split("/")[0];
    const ip = host.split(":")[0];
    if (ip) {
      return asegurarPrefijoApi(`http://${ip}:3000`);
    }
  }

  return asegurarPrefijoApi("http://localhost:3000");
}

function asegurarPrefijoApi(base: string): string {
  let limpio = base.replace(/\/$/, "");
  // Quitar prefijo duplicado si en .env pusieron .../api/v1/api/v1
  while (limpio.endsWith("/api/v1/api/v1")) {
    limpio = limpio.replace(/\/api\/v1\/api\/v1$/, "/api/v1");
  }
  if (limpio.endsWith("/api/v1")) {
    return limpio;
  }
  // EXPO_PUBLIC_API_PREFIX=none solo si el servidor NO usa prefijo global
  if (process.env.EXPO_PUBLIC_API_PREFIX?.trim() === "none") {
    return limpio;
  }
  return `${limpio}/api/v1`;
}

export const API_URL = getApiUrl();
