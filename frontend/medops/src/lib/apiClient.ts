// src/lib/apiClient.ts
import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
});
// DEBUGGING TEMPORAL - VERIFICAR VARIABLES DE ENTORNO
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔍 VITE_DEV_TOKEN:', import.meta.env.VITE_DEV_TOKEN);
// aplicar token inicial si existe
const token = import.meta.env.VITE_DEV_TOKEN;
if (token) {
  console.log('🔍 Setting initial token:', token);
  api.defaults.headers.common["Authorization"] = `Token ${token}`;
}
// interceptor institucional para aplicar token dinámico en cada request
api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_DEV_TOKEN;
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["Authorization"] = `Token ${token}`;
    console.log('🔍 API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token.substring(0, 10) + '...'
    });
  }
  
  // inyectar ID de institución activa automáticamente
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
  (response) => {
    console.log('🔍 API Response:', {
      url: response.config.url,
      status: response.status,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  (error) => {
    console.error('🔍 API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);