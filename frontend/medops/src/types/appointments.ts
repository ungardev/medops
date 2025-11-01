// src/types/appointments.ts
import { PatientRef } from "./patients";
import { Payment } from "./payments";              // 👈 usar el Payment oficial
import { Diagnosis, Treatment, Prescription } from "./consultation"; // 👈 importar desde consultation.ts

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
  expected_amount: string;      // backend devuelve string (Decimal)
  status: AppointmentStatus;
  arrival_time?: string | null;
  notes?: string;
  diagnoses?: Diagnosis[];      // 👈 ahora usa los tipos importados
  payments?: Payment[];         // 👈 usa el Payment oficial
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
