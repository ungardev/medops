// src/api/client.ts
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  const token = localStorage.getItem("authToken");

  // Construimos headers como objeto plano para evitar errores de TS
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // ⚠️ Solo añadimos Content-Type JSON si el body no es FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 🚨 Interceptor de errores de autenticación
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
    throw new Error("Sesión expirada o sin permisos. Redirigiendo al login...");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error ${response.status}: ${text}`);
  }

  // DELETE no devuelve body
  if ((options.method || "GET").toUpperCase() === "DELETE") {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
