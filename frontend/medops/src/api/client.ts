// src/api/client.ts
import { isPatientSubdomain, getCurrentPortal, getPortalConfig } from '@/lib/subdomain';

const API_BASE = import.meta.env.VITE_API_URL;

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

  if (response.status === 401) {
    const portal = getCurrentPortal();
    const config = getPortalConfig(portal);
    
    if (isPatientPortal) {
      localStorage.removeItem("patient_access_token");
      localStorage.removeItem("patient_drf_token");
      localStorage.removeItem("patient_refresh_token");
    } else {
      localStorage.removeItem("doctor_access_token");
      localStorage.removeItem("authToken");
    }
    
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