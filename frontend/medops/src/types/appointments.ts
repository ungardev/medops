// src/types/appointments.ts
import { PatientRef } from "./patients";

// --- Estados posibles de una cita
export type AppointmentStatus =
  | "pending"          // creada, aún no confirmada
  | "arrived"          // paciente llegó
  | "in_consultation"  // en consulta
  | "completed"        // finalizada
  | "canceled";        // cancelada

// --- Modelo de cita (lo que devuelve el backend)
export interface Appointment {
  id: number;
  patient: PatientRef;          // incluye id y name
  appointment_date: string;     // YYYY-MM-DD
  appointment_type: "general" | "specialized";
  expected_amount: string;      // backend devuelve string (Decimal)
  status: AppointmentStatus;
  arrival_time?: string | null;
  notes?: string;
  // relaciones opcionales
  diagnoses?: Diagnosis[];
  payments?: Payment[];
}

// --- Datos de entrada para crear/editar cita
export interface AppointmentInput {
  patient: number;              // id del paciente
  appointment_date: string;
  appointment_type: "general" | "specialized";
  expected_amount?: string;
  status?: AppointmentStatus;
  notes?: string;
}

// --- Tipos auxiliares (si los usas en consultas)
export interface Diagnosis {
  id: number;
  code: string;
  description?: string;
  treatments: Treatment[];
  prescriptions: Prescription[];
}

export interface Treatment {
  id: number;
  plan: string;
  start_date?: string;
  end_date?: string;
}

export interface Prescription {
  id: number;
  medication: string;
  dosage?: string;
  duration?: string;
}

// 🔹 Si necesitas pagos dentro de Appointment
export interface Payment {
  id: number;
  amount: string;
  method: string;
  status: string;
  reference_number?: string;
  bank_name?: string;
  received_by?: string;
  received_at?: string;
}
