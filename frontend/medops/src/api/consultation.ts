import { apiFetch } from "./client";
import { Appointment } from "../types";

// 🔹 Traer la cita en curso
export const getCurrentConsultation = (): Promise<Appointment> =>
  apiFetch<Appointment>("consultation/current/");

// 🔹 Actualizar notas de la cita
export const updateAppointmentNotes = (
  id: number,
  notes: string
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/notes/`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });

// 🔹 Actualizar estado de la cita
export const updateAppointmentStatus = (
  id: number,
  status: string
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
