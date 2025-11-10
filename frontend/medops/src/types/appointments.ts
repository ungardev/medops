// src/types/appointments.ts
import { PatientRef } from "./patients";
import { Payment } from "./payments";              
import { Diagnosis, Treatment, Prescription } from "./consultation"; 

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
  expected_amount: string | number; // 👈 string en payload, number en UI
  status: AppointmentStatus;
  arrival_time?: string | null;
  notes?: string | null;
  diagnoses: Diagnosis[];       // 👈 siempre array
  treatments: Treatment[];      // 👈 siempre array
  prescriptions: Prescription[];// 👈 siempre array
  documents?: any[];            // opcional, según serializer
  payments: Payment[];          // 👈 siempre array
  created_at?: string;          // 👈 añadido
  updated_at?: string;          // 👈 añadido
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
