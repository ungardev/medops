// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL;
async function doFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  
  // Usar token de doctor O paciente (fallback)
  const token = localStorage.getItem("authToken") 
    || localStorage.getItem("patient_drf_token") 
    || "";
  
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  
  // Institution ID header
  const activeInstitutionId = localStorage.getItem("active_institution_id");
  if (activeInstitutionId) {
    headers["X-Institution-ID"] = activeInstitutionId;
  }
  
  // NO establecer Content-Type si hay FormData
  if (options.body && options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  const response = await fetch(url, { ...options, headers });
  
  // Manejo de errores de autenticación con redirección inteligente
  if (response.status === 401) {
    const currentPath = window.location.pathname;
    const isPatientPortal = currentPath.startsWith('/patient');
    
    if (isPatientPortal) {
      localStorage.removeItem("patient_access_token");
      localStorage.removeItem("patient_drf_token");
      localStorage.removeItem("patient_refresh_token");
      localStorage.removeItem("patient_id");
      localStorage.removeItem("patient_name");
      window.location.href = "/patient/login";
    } else {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada. Redirigiendo al login...");
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