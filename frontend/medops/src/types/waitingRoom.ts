import { PatientRef } from "./patients";

// --- Estados posibles en la sala de espera
export type PatientStatus =
  | "scheduled"        // Tiene cita para hoy, pero no ha confirmado llegada
  | "waiting"          // Confirmado o walk-in, esperando en la cola
  | "in_consultation"  // Actualmente en consulta
  | "completed"        // Consulta finalizada
  | "canceled";        // Cancelado

// --- Entrada de la sala de espera
export interface WaitingRoomEntry {
  id: number;
  patient: PatientRef;
  appointment_id: number | null;
  status: PatientStatus;
  arrival_time: string | null;
  priority: "normal" | "alta" | "urgente";
  order: number;
}

