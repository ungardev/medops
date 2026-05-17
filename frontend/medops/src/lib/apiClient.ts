// src/lib/apiClient.ts
import axios from "axios";
import { isPatientSubdomain } from "@/lib/subdomain";

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir a login en errores 401 del doctor portal
    if (error.response?.status === 401 && !isPatientSubdomain()) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/doctor/activate") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);