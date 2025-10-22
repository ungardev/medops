const API_BASE_URL = "http://localhost/api";
// 🔹 Obtener la sala de espera
export async function fetchWaitingRoom() {
    const res = await fetch(`${API_BASE_URL}/waiting-room/`);
    if (!res.ok)
        throw new Error("Error al cargar la sala de espera");
    return res.json();
}
// 🔹 Actualizar estado de una cita
export async function updateAppointmentStatus(id, newStatus) {
    const res = await fetch(`${API_BASE_URL}/appointments/${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
        throw new Error(`Error al actualizar cita ${id}: ${res.statusText}`);
    }
    return res.json();
}
