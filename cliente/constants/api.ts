import Constants from "expo-constants";

/**
 * URL base del API NestJS (sin barra final).
 * - Railway (deploy actual): https://….railway.app  → rutas /auth/login
 * - Nest local (main.ts): http://IP:3000/api/v1     → rutas /auth/login bajo prefijo
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    const looksLikeExample =
      fromEnv.includes("192.168.X.X") || fromEnv.includes("192.168.1.10");
    if (!looksLikeExample) {
      return normalizarBaseUrl(fromEnv);
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
      return normalizarBaseUrl(`http://${ip}:3000`, { esDesarrolloLocal: true });
    }
  }

  return normalizarBaseUrl("http://localhost:3000", { esDesarrolloLocal: true });
}

function normalizarBaseUrl(
  base: string,
  opts?: { esDesarrolloLocal?: boolean },
): string {
  const limpio = base.replace(/\/$/, "");
  if (limpio.endsWith("/api/v1")) {
    return limpio;
  }

  const prefijoExplicito = process.env.EXPO_PUBLIC_API_PREFIX?.trim();
  if (prefijoExplicito === "api/v1") {
    return `${limpio}/api/v1`;
  }
  if (prefijoExplicito === "none" || prefijoExplicito === "") {
    return limpio;
  }

  // Railway en producción aún sirve rutas sin prefijo global
  if (/\.railway\.app$/i.test(limpio) || /\.up\.railway\.app$/i.test(limpio)) {
    return limpio;
  }

  // Nest local (puerto 3000 / LAN)
  if (
    opts?.esDesarrolloLocal ||
    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:3000)?$/i.test(
      limpio,
    ) ||
    /:3000$/i.test(limpio)
  ) {
    return `${limpio}/api/v1`;
  }

  return limpio;
}

export const API_URL = getApiUrl();
