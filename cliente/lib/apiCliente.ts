import axios from "axios";
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

export default api;
