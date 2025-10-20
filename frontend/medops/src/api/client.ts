export async function apiFetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`/api/${endpoint}`, {
        headers: {
            "Accept": "application/json",
        },
        credentials: "same-origin",
    });
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}
