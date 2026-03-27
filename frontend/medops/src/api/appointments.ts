// src/api/appointments.ts
import axios from 'axios';
import { Appointment, AppointmentInput, AppointmentStatus } from "../types/appointments";
import { mapAppointmentList } from "../utils/appointmentsMapper";
import { OperationalItem } from "@/types/operational";
import { apiFetch } from "./client";
// Configuración de Axios para el Portal del Paciente
const API_BASE_URL = '/api';
const patientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Interceptor para agregar token del paciente
patientApi.interceptors.request.use((config) => {
  let token = localStorage.getItem('patient_drf_token');
  if (!token) {
    token = localStorage.getItem('patient_access_token');
  }
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
// ✅ NUEVO: Endpoint unificado para calendario (usar apiFetch original)
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
// ✅ Mantener función existente pero usando mapeador (usar apiFetch original)
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await apiFetch<{ results: any[] }>("appointments/");
  return response.results.map(mapAppointmentList);
};
// ✅ MODIFICADO: Usar Axios para autenticación del paciente
export const createAppointment = async (data: AppointmentInput): Promise<Appointment> => {
  const response = await patientApi.post<Appointment>("appointments/", data);
  return response.data;
};
// ✅ Mantener funciones originales (usar apiFetch para doctor/admin)
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
// ✅ MODIFICADO: Usar Axios para autenticación del paciente
export const getAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await patientApi.get<any[]>(`appointments/?patient=${patientId}`);
  return response.data.map(mapAppointmentList);
};
// ✅ MODIFICADO: Usar Axios para autenticación del paciente
export const getCompletedAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await patientApi.get<any[]>(`patients/${patientId}/completed_appointments/`);
  return response.data.map(mapAppointmentList);
};
// ✅ MODIFICADO: Usar Axios para autenticación del paciente
export const getPendingAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await patientApi.get<any[]>(`patients/${patientId}/pending_appointments/`);
  return response.data.map(mapAppointmentList);
};