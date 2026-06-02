// src/api/client.ts
import { isPatientSubdomain, getCurrentPortal, getPortalConfig } from '@/lib/subdomain';

const API_BASE = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("doctor_refresh_token");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.access;
      localStorage.setItem("doctor_access_token", newAccessToken);
      
      // Si rotated, actualizar refresh token también
      if (data.refresh) {
        localStorage.setItem("doctor_refresh_token", data.refresh);
      }
      
      return newAccessToken;
    }
  } catch {
    // Refresh falló
  }
  
  // Limpiar tokens si refresh falló
  localStorage.removeItem("doctor_access_token");
  localStorage.removeItem("doctor_refresh_token");
  return null;
}

async function doFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  
  const isPatientPortal = isPatientSubdomain();
  
  let authToken: string | null = null;
  let tokenType: 'Bearer' | 'Token' = 'Bearer';

  if (isPatientPortal) {
    authToken = localStorage.getItem("patient_drf_token") || localStorage.getItem("patient_access_token");
    tokenType = 'Token';
  } else {
    authToken = localStorage.getItem("doctor_access_token") || localStorage.getItem("authToken");
    tokenType = 'Bearer';
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(authToken ? { Authorization: `${tokenType} ${authToken}` } : {}),
    ...(options.headers as Record<string, string>),
    'X-Portal': getCurrentPortal(),
  };

  const activeInstitutionId = localStorage.getItem("active_institution_id");
  if (activeInstitutionId) {
    headers["X-Institution-ID"] = activeInstitutionId;
  }

  if (options.body && options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  // Solo para Doctor Portal: intentar refresh en 401
  if (response.status === 401 && !isPatientPortal && !(options as any)._retry) {
    const config = getPortalConfig('app');
    
    if (isRefreshing) {
      // Ya hay refresh en progreso - esperar
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (token: string) => {
          (options as any)._retry = true;
          headers['Authorization'] = `Bearer ${token}`;
          const retryResponse = await fetch(url, { ...options, headers });
          resolve(retryResponse);
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        isRefreshing = false;
        onRefreshed(newToken);
        
        // Reintentar request con nuevo token
        (options as any)._retry = true;
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return retryResponse;
      }
    } catch {
      isRefreshing = false;
    }

    // Refresh falló - logout
    localStorage.removeItem("doctor_access_token");
    localStorage.removeItem("doctor_refresh_token");
    localStorage.removeItem("authToken");
    window.location.href = getPortalConfig('app').loginPath;
    throw new Error("Sesion expirada. Redirigiendo al login...");
  }

  // Para Patient Portal 401 o Doctor 401 después de refresh fallido
  if (response.status === 401 && isPatientPortal) {
    const config = getPortalConfig('patient');
    
    localStorage.removeItem("patient_access_token");
    localStorage.removeItem("patient_drf_token");
    localStorage.removeItem("patient_refresh_token");
    
    window.location.href = config.loginPath;
    throw new Error("Sesion expirada. Redirigiendo al login...");
  }

  return response;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const response = await doFetch<T>(endpoint, options);

  if (method === "DELETE") {
    if (!response.ok) {
      const text = await response.text();
      const error: any = new Error(`Error ${response.status}: ${text}`);
      error.status = response.status;
      throw error;
    }
    return {} as T;
  }

  if (response.status === 204) {
    const error: any = new Error("No Content en endpoint estricto");
    error.status = 204;
    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    const error: any = new Error(`Error ${response.status}: ${text}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as T;
  return data;
}

export async function apiFetchOptional<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const response = await doFetch<T>(endpoint, options);

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    const error: any = new Error(`Error ${response.status}: ${text}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as T;
  return data;
}