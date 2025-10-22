export async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`/api/${endpoint}`, {
        credentials: "same-origin",
        headers: {
            "Accept": "application/json",
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
        return {};
    }
    return response.json();
}
