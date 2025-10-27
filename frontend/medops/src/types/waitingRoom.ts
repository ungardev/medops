import { PatientRef } from "./patients";

// --- Estados posibles de una entrada en la sala de espera
export type WaitingRoomStatus =
  | "waiting"          // Paciente en cola
  | "in_consultation"  // Actualmente en consulta
  | "completed"        // Consulta finalizada
  | "canceled"         // Cancelado
  | "pending";         // 👈 Nuevo: cita del día aún no confirmada

// --- Prioridades posibles en la sala de espera
export type WaitingRoomPriority =
  | "normal"     // Paciente con cita programada estándar
  | "scheduled"  // Paciente con cita programada explícita
  | "walkin"     // Paciente sin cita, llega directo (Grupo B)
  | "emergency"; // Paciente promovido a emergencia

// --- Entrada de la sala de espera
export interface WaitingRoomEntry {
  id: number;
  patient: PatientRef;          // 👈 objeto { id, name }
  appointment_id: number | null;
  status: WaitingRoomStatus;    // 👈 estado de la entrada
  arrival_time: string | null;  // ISO string
  priority: WaitingRoomPriority;
  order: number;
}

// --- Datos de entrada para crear/editar entrada en sala de espera
export interface WaitingRoomEntryInput {
  patient: number;              // id del paciente
  appointment_id: number | null;
  priority?: WaitingRoomPriority;
}

// --- Grupo de sala de espera (respuesta de /waitingroom/groups-today/)
export interface WaitingroomGroup {
  status: string; // estado (waiting, in_consultation, completed, canceled, pending, etc.)
  total: number;  // cantidad de pacientes en ese estado
}
