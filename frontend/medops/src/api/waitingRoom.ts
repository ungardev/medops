// src/api/waitingRoom.ts
import { apiFetch } from "./client";
import {
  WaitingRoomEntry,
  WaitingRoomStatus,
  WaitingRoomPriority,
} from "../types/waitingRoom";

// 🔹 Obtener todas las entradas de la sala de espera
export const getWaitingRoom = (): Promise<WaitingRoomEntry[]> =>
  apiFetch<WaitingRoomEntry[]>("waitingroom/");

// 🔹 Crear una nueva entrada en la sala de espera
export const createWaitingRoomEntry = (
  data: Partial<WaitingRoomEntry>
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>("waitingroom/", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 🔹 Actualizar una entrada completa
export const updateWaitingRoomEntry = (
  id: number,
  data: Partial<WaitingRoomEntry>
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>(`waitingroom/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// 🔹 Eliminar una entrada
export const deleteWaitingRoomEntry = (id: number): Promise<void> =>
  apiFetch<void>(`waitingroom/${id}/`, {
    method: "DELETE",
  });

// 🔹 Actualizar solo el estado de una entrada
export const updateWaitingRoomStatus = (
  id: number,
  newStatus: WaitingRoomStatus   // ✅ tipo correcto
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>(`waitingroom/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });

// 🔹 Promover una entrada a emergencia
export const promoteToEmergency = (id: number): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>(`waitingroom/${id}/promote_to_emergency/`, {
    method: "PATCH",
  });

// 🔹 Confirmar paciente (ej. mover de grupo B a grupo A)
export const confirmWaitingRoomEntry = (
  id: number
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>(`waitingroom/${id}/confirm/`, {
    method: "PATCH",
  });

// 🔹 Cerrar jornada: cancelar todos los pacientes en "waiting"
export const closeWaitingRoomDay = (): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("waitingroom/close_day/", {
    method: "POST",
  });

// 🔹 Obtener grupos del día (A y B) desde el backend
export const getWaitingRoomGroupsToday = (): Promise<{
  grupo_a: WaitingRoomEntry[];
  grupo_b: WaitingRoomEntry[];
}> =>
  apiFetch<{ grupo_a: WaitingRoomEntry[]; grupo_b: WaitingRoomEntry[] }>(
    "waitingroom/groups-today/"
  );

// 🔹 Registrar llegada de un paciente walk-in
export const registerWalkinEntry = (
  patientId: number
): Promise<WaitingRoomEntry> =>
  apiFetch<WaitingRoomEntry>("waitingroom/register_walkin/", {
    method: "POST",
    body: JSON.stringify({ patient_id: patientId }),
  });
