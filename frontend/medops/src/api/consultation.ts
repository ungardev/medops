// src/api/consultation.ts
import { apiFetch, apiFetchOptional } from "./client";
import { Appointment } from "../types";

// 🔹 GET opcional: puede devolver null
export const getCurrentConsultation = (): Promise<Appointment | null> =>
  apiFetchOptional<Appointment>("consultation/current/");

// 🔹 PATCH estrictos: siempre devuelven Appointment
export const updateAppointmentNotes = (
  id: number,
  notes: string
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/notes/`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });

export const updateAppointmentStatus = (
  id: number,
  status: string
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
