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
  patient: PatientRef;          // referencia ligera al paciente
  appointment_date: string;     // YYYY-MM-DD
  appointment_type: "general" | "specialized";
  expected_amount: string;
  status: AppointmentStatus;
}

// --- Datos de entrada para crear/editar cita
export interface AppointmentInput {
  patient: number;              // al crear cita, se envía solo el id del paciente
  appointment_date: string;
  appointment_type: "general" | "specialized";
  expected_amount?: string;
  status?: AppointmentStatus;
}
