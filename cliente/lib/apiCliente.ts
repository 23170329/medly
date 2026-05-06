import axios from "axios";
import { API_URL } from "../constants/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  return config;
});

export default api;
