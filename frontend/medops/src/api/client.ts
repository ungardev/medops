// src/api/client.ts
const API_BASE =
  import.meta.env.VITE_API_ROOT || "http://127.0.0.1:8000/api"; // ✅ configurable vía .env

async function doFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // ✅ Blindaje: si endpoint ya es absoluto, úsalo tal cual
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");

  // ✅ Token institucional unificado: siempre usa el mismo .env
  const token =
    localStorage.getItem("authToken") ||
    import.meta.env.VITE_DEV_TOKEN || // 👈 unificado con curl
    "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  console.log("[CLIENT] Fetch →", url, options.method || "GET"); // ⚔️ trazador

  const start = performance.now();
  const response = await fetch(url, { ...options, headers });
  const end = performance.now();
  console.log(`⏱️ Tiempo fetch (solo red): ${(end - start).toFixed(2)} ms`);

  // ✅ Manejo institucional de errores de autenticación
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
    throw new Error("Sesión expirada o sin permisos. Redirigiendo al login...");
  }

  return response;
}

// 🔹 Endpoints estrictos (PATCH/POST/PUT/GET/DELETE)
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
    console.log("[CLIENT] DELETE completado en", endpoint);
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

  const parseStart = performance.now();
  const data = await response.json() as T;
  const parseEnd = performance.now();
  console.log(`⏱️ Tiempo parse JSON: ${(parseEnd - parseStart).toFixed(2)} ms`);

  return data;
}

// 🔹 Endpoints GET opcionales (mapear 404/204 → null)
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

  const parseStart = performance.now();
  const data = await response.json() as T;
  const parseEnd = performance.now();
  console.log(`⏱️ Tiempo parse JSON (optional): ${(parseEnd - parseStart).toFixed(2)} ms`);

  return data;
}
