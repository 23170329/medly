import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../stores/auth.store";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    const err = error as {
      response?: { status?: number };
      config?: InternalAxiosRequestConfig & { _retry?: boolean };
    };
    const status = err.response?.status;
    const originalRequest = err.config;
    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    const url = String(originalRequest.url ?? "");
    if (
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/ingreso")
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    const refreshed = await useAuthStore.getState().refreshAccessToken();
    if (!refreshed) {
      await useAuthStore.getState().cerrarSesion();
      return Promise.reject(error);
    }
    const newTok = useAuthStore.getState().accessToken;
    if (newTok) {
      originalRequest.headers.Authorization = `Bearer ${newTok}`;
    }
    return api(originalRequest);
  },
);

export default api;
