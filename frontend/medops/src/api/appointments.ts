// src/api/appointments.ts
import { apiFetch } from "./client";
import { Appointment, AppointmentInput, AppointmentStatus } from "../types/appointments";
export const getAppointments = (): Promise<Appointment[]> =>
  apiFetch<Appointment[]>("appointments/");
export const createAppointment = (data: AppointmentInput): Promise<Appointment> =>
  apiFetch<Appointment>("appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateAppointment = (
  id: number,
  data: Partial<AppointmentInput>
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteAppointment = (id: number): Promise<void> =>
  apiFetch<void>(`appointments/${id}/`, {
    method: "DELETE",
  });
export const fetchAppointmentDetail = (id: number): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/`);
export const updateAppointmentStatus = (
  id: number,
  newStatus: AppointmentStatus
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/status/`, {
    method: "POST",  // ← CORREGIDO: era PATCH
    body: JSON.stringify({ status: newStatus }),
  });
export const updateAppointmentNotes = (
  id: number,
  notes: string
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/notes/`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
export const getAppointmentsByPatient = (patientId: number): Promise<Appointment[]> =>
  apiFetch<Appointment[]>(`appointments/?patient=${patientId}`);
export const getCompletedAppointmentsByPatient = (patientId: number): Promise<Appointment[]> =>
  apiFetch<Appointment[]>(`patients/${patientId}/completed_appointments/`);
export const getPendingAppointmentsByPatient = (patientId: number): Promise<Appointment[]> =>
  apiFetch<Appointment[]>(`patients/${patientId}/pending_appointments/`);