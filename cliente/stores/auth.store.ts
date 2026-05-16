import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/api";

export interface Usuario {
  id: string;
  pacienteId?: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: "PACIENTE" | "MEDICO" | "RECEPCIONISTA" | "ADMIN";
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  cargando: boolean;
  setAuth: (
    usuario: Usuario,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  cargarSesion: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  accessToken: null,
  refreshToken: null,
  cargando: true,

  setAuth: async (usuario, accessToken, refreshToken) => {
    await SecureStore.setItemAsync("access_token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    await SecureStore.setItemAsync("usuario", JSON.stringify(usuario));
    set({ usuario, accessToken, refreshToken });
  },

  refreshAccessToken: async () => {
    const rt = await SecureStore.getItemAsync("refresh_token");
    if (!rt) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return false;
      const d = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        usuario: Usuario;
      };
      await get().setAuth(d.usuario, d.access_token, d.refresh_token);
      return true;
    } catch {
      return false;
    }
  },

  cerrarSesion: async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
    } catch {
      /* ignore */
    }
    try {
      await SecureStore.deleteItemAsync("refresh_token");
    } catch {
      /* ignore */
    }
    try {
      await SecureStore.deleteItemAsync("usuario");
    } catch {
      /* ignore */
    }
    set({ usuario: null, accessToken: null, refreshToken: null });
  },

  cargarSesion: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("access_token");
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      const usuarioStr = await SecureStore.getItemAsync("usuario");
      if (accessToken && usuarioStr) {
        set({
          accessToken,
          refreshToken: refreshToken ?? null,
          usuario: JSON.parse(usuarioStr) as Usuario,
        });
      }
    } catch {
      /* ignore */
    } finally {
      set({ cargando: false });
    }
  },
}));
