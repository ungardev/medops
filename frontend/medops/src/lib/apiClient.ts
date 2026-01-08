// src/lib/apiClient.ts
import axios from "axios";

// ⚔️ Usar la variable de entorno definida en .env.production
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // ✅ ahora apunta a http://127.0.0.1:8000/api
  withCredentials: false,                 // ✅ no enviar cookies, solo token
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
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
});
