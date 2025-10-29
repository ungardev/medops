// src/api/appointments.ts
import { apiFetch } from "./client";
import { Appointment, AppointmentInput, AppointmentStatus } from "../types/appointments";

// 🔹 Obtener todas las citas
export const getAppointments = (): Promise<Appointment[]> =>
  apiFetch<Appointment[]>("appointments/");

// 🔹 Crear una nueva cita
export const createAppointment = (data: AppointmentInput): Promise<Appointment> =>
  apiFetch<Appointment>("appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 🔹 Actualizar una cita completa
export const updateAppointment = (
  id: number,
  data: Partial<AppointmentInput>
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// 🔹 Eliminar una cita
export const deleteAppointment = (id: number): Promise<void> =>
  apiFetch<void>(`appointments/${id}/`, {
    method: "DELETE",
  });

// 🔹 Obtener detalle de una cita por ID
export const fetchAppointmentDetail = (id: number): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/`);

// 🔹 Actualizar solo el estado de una cita
export const updateAppointmentStatus = (
  id: number,
  newStatus: AppointmentStatus
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });

// 🔹 Actualizar notas de una cita
export const updateAppointmentNotes = (
  id: number,
  notes: string
): Promise<Appointment> =>
  apiFetch<Appointment>(`appointments/${id}/notes/`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });

/**
 * Extensiones enfocadas en paciente
 * Nota: estos endpoints requieren soporte en el backend (PatientViewSet).
 */

// 🔹 Obtener todas las citas de un paciente (sin filtrar por estado)
export const getAppointmentsByPatient = (patientId: number): Promise<Appointment[]> =>
  apiFetch<Appointment[]>(`appointments/?patient=${patientId}`);

// 🔹 Obtener citas COMPLETADAS de un paciente
export const getCompletedAppointmentsByPatient = (patientId: number): Promise<Appointment[]> =>
  apiFetch<Appointment[]>(`patients/${patientId}/completed_appointments/`);

// 🔹 Obtener citas PENDIENTES/EN CURSO de un paciente
export const getPendingAppointmentsByPatient = (patientId: number): Promise<Appointment[]> =>
  apiFetch<Appointment[]>(`patients/${patientId}/pending_appointments/`);
