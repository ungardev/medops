const API_BASE_URL = "http://127.0.0.1/api"; // ✅ ahora apunta al proxy de Nginx

export async function fetchWaitingRoom() {
  const res = await fetch(`${API_BASE_URL}/waiting-room/`);
  if (!res.ok) throw new Error("Error al cargar la sala de espera");
  return res.json();
}