import { PatientRef } from "./patients";

// --- Estados posibles de una cita
export type AppointmentStatus =
  | "pending"          // creada, aún no confirmada
  | "arrived"          // paciente llegó
  | "in_consultation"  // en consulta
  | "completed"        // finalizada
  | "canceled";        // cancelada

// --- Modelo de cita
export interface Appointment {
  id: number;
  patient: PatientRef;          // 👈 siempre incluye id y name
  appointment_date: string;     // YYYY-MM-DD
  appointment_type: "general" | "specialized";
  expected_amount: string;
  status: AppointmentStatus;
  arrival_time?: string | null; // opcional, si lo devuelves en el serializer
  notes?: string;               // evolución clínica
}

// --- Datos de entrada para crear/editar cita
export interface AppointmentInput {
  patient: number;              // al crear cita, se envía solo el id del paciente
  appointment_date: string;
  appointment_type: "general" | "specialized";
  expected_amount?: string;
  status?: AppointmentStatus;
  notes?: string;
}
