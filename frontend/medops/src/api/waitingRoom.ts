const API_BASE_URL = "http://localhost/api";

// 🔹 Obtener la sala de espera
export async function fetchWaitingRoom() {
  const res = await fetch(`${API_BASE_URL}/waitingroom/`);
  if (!res.ok) throw new Error("Error al cargar la sala de espera");
  return res.json();
}

// 🔹 Actualizar estado de una entrada en la sala de espera
export async function updateWaitingRoomStatus(id: number, newStatus: string) {
  const res = await fetch(`${API_BASE_URL}/waitingroom/${id}/status/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!res.ok) {
    throw new Error(`Error al actualizar entrada ${id}: ${res.statusText}`);
  }

  return res.json();
}
