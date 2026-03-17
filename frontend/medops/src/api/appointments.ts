// src/api/appointments.ts
import { apiFetch } from "./client";
import { Appointment, AppointmentInput, AppointmentStatus } from "../types/appointments";
import { mapAppointmentList } from "../utils/appointmentsMapper";
import { OperationalItem } from "@/types/operational";
// ✅ NUEVO: Endpoint unificado para calendario
export const getOperationalTimeline = async (institutionId: number, month: Date): Promise<OperationalItem[]> => {
  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;
  
  const response = await apiFetch<{ results: any[] }>(
    `operational-hub/?institution_id=${institutionId}&year=${year}&month=${monthNum}`
  );
  
  return response.results.map((item: any) => ({
    id: item.id,
    type: item.type || 'appointment',
    date: item.date || item.appointment_date,
    time: item.time || item.tentative_time,
    title: item.title || item.patient_name || 'Servicio',
    status: item.status,
    patientName: item.patient_name,
    doctorName: item.doctor_name,
    serviceName: item.service_name,
    metadata: item
  })) as OperationalItem[];
};
// ✅ Mantener función existente pero usando mapeador
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await apiFetch<{ results: any[] }>("appointments/");
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
  return response.map(mapAppointmentList);
};
export const getCompletedAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await apiFetch<any[]>(`patients/${patientId}/completed_appointments/`);
  return response.map(mapAppointmentList);
};
export const getPendingAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await apiFetch<any[]>(`patients/${patientId}/pending_appointments/`);
  return response.map(mapAppointmentList);
};