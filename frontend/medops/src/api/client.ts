// src/api/client.ts
const API_BASE = "http://127.0.0.1:8000/api";  // ⚔️ Forzado para demo CS50W

async function doFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  const token = localStorage.getItem("authToken");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

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
  const response = await doFetch<T>(endpoint, options);

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

  if ((options.method || "GET").toUpperCase() === "DELETE") {
    return {} as T;
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
