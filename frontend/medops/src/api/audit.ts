import { apiFetch } from "./client";

export interface AuditEvent {
  id: number;
  entity: string;
  entity_id: number;
  action: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, any>; // 👈 agregado como opcional
}

export const getAuditByAppointment = (appointmentId: number) =>
  apiFetch<AuditEvent[]>(`audit/appointment/${appointmentId}/`);

export const getAuditByPatient = (patientId: number) =>
  apiFetch<AuditEvent[]>(`audit/patient/${patientId}/`);
