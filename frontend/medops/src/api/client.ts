const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");

  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  // DELETE normalmente no devuelve JSON
  if ((options.method || "GET").toUpperCase() === "DELETE") {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
