// src/types/appointments.ts
// =====================================================
// IMPORTAR TIPOS DESDE identity.ts
// =====================================================
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "./identity";
// =====================================================
// ENUMS - Alineados con backend
// =====================================================
export type AppointmentStatus = "pending" | "arrived" | "in_consultation" | "completed" | "canceled";
export type AppointmentType = "general" | "specialized";
// =====================================================
// TIPO PARA PAGOS (dentro de charge_order)
// =====================================================
export interface ChargeOrderPayment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_number?: string | null;
  received_at?: string | null;
}
// =====================================================
// TIPO PARA CHARGE_ORDER (del serializer)
// =====================================================
export interface ChargeOrderSummary {
  id: number;
  status: string;
  total_amount: number;
  balance_due: number;
  order_number?: string;
  payments?: ChargeOrderPayment[];
}
// =====================================================
// MODELO DE CITA (lo que devuelve el backend)
// =====================================================
export interface Appointment {
  id: number;
  
  // Relaciones principales
  patient: IdentityPatient;
  institution: IdentityInstitution;
  doctor: IdentityDoctor;
  
  // Datos temporales
  appointment_date: string;
  start_time?: string | null;
  arrival_time?: string | null;
  status: AppointmentStatus;
  status_display?: string;
  appointment_type: AppointmentType;
  appointment_type_display?: string;
  
  // Brazo financiero
  expected_amount: string | number;
  notes?: string | null;
  
  // Bloques clínicos
  diagnoses: any[];
  treatments: any[];
  prescriptions: any[];
  
  // Documentos y pagos
  documents?: any[];
  payments: any[];
  balance_due?: number;
  charge_order?: ChargeOrderSummary | null;
  documents_count?: number;
  
  // Nuevos campos (médicos, exámenes)
  medical_tests?: any[];
  referrals?: any[];
  
  // Métricas de tiempo
  started_at?: string | null;
  completed_at?: string | null;
  
  // Metadatos
  created_at?: string;
  updated_at?: string;
}
// =====================================================
// APPOINTMENT UI (para componentes)
// =====================================================
export interface AppointmentUI extends Appointment {
  started_at: string | null;
}
// =====================================================
// DATOS DE ENTRADA PARA CREAR/EDITAR CITA
// =====================================================
export interface AppointmentInput {
  patient: number;
  institution: number;
  doctor: number;
  appointment_date: string;
  start_time?: string;
  appointment_type: AppointmentType;
  expected_amount?: string;
  status?: AppointmentStatus;
  notes?: string;
}