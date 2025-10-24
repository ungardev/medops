// src/types/waitingRoom.ts
import { PatientRef } from "./patients";

// --- Estados clínicos posibles en la sala de espera
export type PatientStatus =
  | "waiting"          // Confirmado o walk-in, esperando en la cola
  | "in_consultation"  // Actualmente en consulta
  | "completed"        // Consulta finalizada
  | "canceled";        // Cancelado

// --- Prioridades posibles en la sala de espera
export type WaitingRoomPriority =
  | "scheduled"  // Paciente con cita programada
  | "emergency"  // Paciente promovido a emergencia
  | "walkin";    // Paciente sin cita (llegada espontánea)

// --- Entrada de la sala de espera
export interface WaitingRoomEntry {
  id: number;
  patient: PatientRef;
  appointment_id: number | null;
  status: PatientStatus;           // Estado clínico
  arrival_time: string | null;
  priority: WaitingRoomPriority;   // Tipo de prioridad
  order: number;
}
