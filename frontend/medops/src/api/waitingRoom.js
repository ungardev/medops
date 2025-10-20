const API_BASE_URL = "http://localhost/api";
export async function fetchWaitingRoom() {
    const res = await fetch(`${API_BASE_URL}/waiting-room/`);
    if (!res.ok)
        throw new Error("Error al cargar la sala de espera");
    return res.json();
}
