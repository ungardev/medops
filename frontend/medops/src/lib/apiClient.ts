// src/lib/apiClient.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
});

// 🔒 aplicar token inicial si existe
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["Authorization"] = `Token ${token}`;
}

// 🔒 interceptor institucional para aplicar token dinámico en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    // ⚔️ blindaje: inicializar headers si no existen
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
});
