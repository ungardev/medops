export async function apiFetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}`);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}
