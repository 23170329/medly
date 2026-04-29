import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "PACIENTE" | "MEDICO" | "RECEPCIONISTA" | "ADMIN";
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  cargando: boolean;
  setAuth: (usuario: Usuario, token: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cargarSesion: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  accessToken: null,
  cargando: true,

  setAuth: async (usuario, token) => {
    await SecureStore.setItemAsync("access_token", token);
    await SecureStore.setItemAsync("usuario", JSON.stringify(usuario));
    set({ usuario, accessToken: token });
  },

  cerrarSesion: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("usuario");
    set({ usuario: null, accessToken: null });
  },

  cargarSesion: async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const usuarioStr = await SecureStore.getItemAsync("usuario");
      if (token && usuarioStr) {
        set({ accessToken: token, usuario: JSON.parse(usuarioStr) });
      }
    } catch {
    } finally {
      set({ cargando: false });
    }
  },
}));
