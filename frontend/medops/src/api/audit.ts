import { apiFetch } from "./client";

export interface AuditEvent {
  id: number;
  entity: string;
  entity_id: number;
  action: string;
  timestamp: string; // ISO string
  actor?: string | null; // puede venir vacío
  metadata?: Record<string, any> | null;
}

export const getAuditByAppointment = (appointmentId: number) =>
  apiFetch<AuditEvent[]>(`audit/appointment/${appointmentId}/`);

export const getAuditByPatient = (patientId: number) =>
  apiFetch<AuditEvent[]>(`audit/patient/${patientId}/`);

