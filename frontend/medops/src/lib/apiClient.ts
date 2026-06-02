// src/lib/apiClient.ts
import axios from "axios";
import { isPatientSubdomain } from "@/lib/subdomain";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
});

// Interceptor institucional para aplicar token dinámico en cada request
api.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = {};
  }

  // Determinar el portal y token apropiado
  const isPatientPortal = isPatientSubdomain();

  if (isPatientPortal) {
    // Patient Portal: usar token de paciente (DRF Token format)
    const patientToken = localStorage.getItem("patient_drf_token") || localStorage.getItem("patient_access_token");
    if (patientToken) {
      config.headers["Authorization"] = `Token ${patientToken}`;
    }
  } else {
    // Doctor Portal: usar JWT Bearer token
    const doctorAccessToken = localStorage.getItem("doctor_access_token");
    if (doctorAccessToken) {
      config.headers["Authorization"] = `Bearer ${doctorAccessToken}`;
    }
  }

  // Inyectar ID de institución activa automáticamente
  const activeInstitutionId = localStorage.getItem("active_institution_id");
  if (activeInstitutionId) {
    config.headers["X-Institution-ID"] = activeInstitutionId;
  }

  // X-Portal header para debugging
  config.headers["X-Portal"] = isPatientPortal ? "patient" : "doctor";

  return config;
});

// Flag para prevenir múltiples refresh simultáneos
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Función para refrescar el access token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("doctor_refresh_token");
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
      refresh: refreshToken,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200) {
      const data = response.data as { access: string; refresh?: string };
      const newAccessToken = data.access;
      localStorage.setItem("doctor_access_token", newAccessToken);
      
      // Si rotated, actualizar refresh token también
      if (data.refresh) {
        localStorage.setItem("doctor_refresh_token", data.refresh);
      }
      
      return newAccessToken;
    }
  } catch {
    // Refresh falló - limpiar tokens
    localStorage.removeItem("doctor_access_token");
    localStorage.removeItem("doctor_refresh_token");
  }
  return null;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Solo manejar 401 del doctor portal (no patient)
    if (error.response?.status === 401 && !isPatientSubdomain() && !originalRequest._retry) {
      const currentPath = window.location.pathname;
      
      // No interceptar en páginas de login/activate
      if (currentPath === "/login" || currentPath === "/doctor/activate") {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Ya hay un refresh en progreso - esperar a que complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          isRefreshing = false;
          onRefreshed(newToken);
          
          // Reintentar request original con nuevo token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        isRefreshing = false;
      }

      // Refresh falló - redirigir a login
      localStorage.removeItem("doctor_access_token");
      localStorage.removeItem("doctor_refresh_token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;