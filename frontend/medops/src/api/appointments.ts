// src/api/appointments.ts
import { apiFetch } from "./client";
import { Appointment, AppointmentInput, AppointmentStatus } from "../types/appointments";
import { mapAppointmentList } from "../utils/appointmentsMapper";
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await apiFetch<{ results: any[] }>("appointments/");
  // ✅ APLICAR MAPPER A LOS RESULTADOS
  return response.results.map(mapAppointmentList);
};
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
    method: "POST",
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
export const getAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await apiFetch<any[]>(`appointments/?patient=${patientId}`);
  // ✅ APLICAR MAPPER A LOS RESULTADOS
  return response.map(mapAppointmentList);
};
export const getCompletedAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await apiFetch<any[]>(`patients/${patientId}/completed_appointments/`);
  // ✅ APLICAR MAPPER A LOS RESULTADOS
  return response.map(mapAppointmentList);
};
export const getPendingAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await apiFetch<any[]>(`patients/${patientId}/pending_appointments/`);
  // ✅ APLICAR MAPPER A LOS RESULTADOS
  return response.map(mapAppointmentList);
};