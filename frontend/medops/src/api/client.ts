// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_ROOT || "http://127.0.0.1:8000/api";  // ✅ configurable vía .env

async function doFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // ✅ Blindaje: si endpoint ya es absoluto, úsalo tal cual
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");

  // ✅ Token desde localStorage o .env
  const token =
    localStorage.getItem("authToken") ||
    import.meta.env.VITE_API_TOKEN ||
    "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  // ✅ Manejo institucional de errores de autenticación
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
    throw new Error("Sesión expirada o sin permisos. Redirigiendo al login...");
  }

  return response;
}

// 🔹 Use para endpoints que deben devolver datos (PATCH/POST/PUT/GET estrictos)
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const response = await doFetch<T>(endpoint, options);

  // ✅ DELETE debe devolver vacío sin lanzar error por 204
  if (method === "DELETE") {
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

  return response.json() as Promise<T>;
}

// 🔹 Use para GET opcionales que pueden no tener datos (mapear 404/204 → null)
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

  return response.json() as Promise<T>;
}
