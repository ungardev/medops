// src/lib/apiClient.ts
import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
});
// Aplicar token inicial si existe
const token = import.meta.env.VITE_DEV_TOKEN;
if (token) {
  api.defaults.headers.common["Authorization"] = `Token ${token}`;
}
// Interceptor institucional para aplicar token dinámico en cada request
api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_DEV_TOKEN;
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["Authorization"] = `Token ${token}`;
  }
  
  // Inyectar ID de institución activa automáticamente
  const activeInstitutionId = localStorage.getItem("active_institution_id");
  if (activeInstitutionId) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["X-Institution-ID"] = activeInstitutionId;
  }
  
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);