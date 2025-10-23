import { apiFetch } from "./client";
import { WaitingRoomEntry, PatientStatus } from "../types/waitingRoom";

// 🔹 Obtener todas las entradas de la sala de espera
export const getWaitingRoom = (): Promise<WaitingRoomEntry[]> =>
  apiFetch<WaitingRoomEntry[]>("waiting-room/");

// 🔹 Crear una nueva entrada en la sala de espera
export const createWaitingRoomEntry = (
  data: Partial<WaitingRoomEntry>
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>("waiting-room/", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 🔹 Actualizar una entrada completa
export const updateWaitingRoomEntry = (
  id: number,
  data: Partial<WaitingRoomEntry>
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>(`waiting-room/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// 🔹 Eliminar una entrada
export const deleteWaitingRoomEntry = (id: number): Promise<void> =>
  apiFetch<void>(`waiting-room/${id}/`, {
    method: "DELETE",
  });

// 🔹 Actualizar solo el estado de una entrada
export const updateWaitingRoomStatus = (
  id: number,
  newStatus: PatientStatus
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>(`waiting-room/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });
