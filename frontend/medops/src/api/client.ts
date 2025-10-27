// src/api/client.ts
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  const token = localStorage.getItem("authToken");

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // 🚨 Interceptor de errores de autenticación
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("authToken");
    // Redirige al login
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
