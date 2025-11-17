// src/types/appointments.ts
import { PatientRef } from "./patients";
import { Payment, ChargeOrder } from "./payments";
import {
  Diagnosis,
  Treatment,
  Prescription,
  MedicalTest,
  MedicalReferral,
} from "./consultation";

// --- Estados posibles de una cita
export type AppointmentStatus =
  | "pending"
  | "arrived"
  | "in_consultation"
  | "completed"
  | "canceled";

// --- Modelo de cita (lo que devuelve el backend)
export interface Appointment {
  id: number;
  patient: PatientRef;
  appointment_date: string;     // YYYY-MM-DD
  appointment_type: "general" | "specialized";
  expected_amount: string | number; // string en payload, number en UI
  status: AppointmentStatus;
  arrival_time?: string | null;
  notes?: string | null;

  // 🔹 Bloques clínicos
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  prescriptions: Prescription[];

  // 🔹 Documentos y pagos
  documents?: any[];
  payments: Payment[];

  // 🔹 Campos adicionales del serializer de consulta
  balance_due?: number;
  charge_order?: ChargeOrder;

  // 🔹 Nuevos campos del backend
  medical_tests?: MedicalTest[];
  referrals?: MedicalReferral[];

  // 🔹 Metadatos
  created_at?: string;
  updated_at?: string;
}

// --- Datos de entrada para crear/editar cita
export interface AppointmentInput {
  patient: number;
  appointment_date: string;
  appointment_type: "general" | "specialized";
  expected_amount?: string;
  status?: AppointmentStatus;
  notes?: string;
}
