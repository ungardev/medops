import { PatientRef } from "./patients";

// --- Estados posibles de una entrada en la sala de espera
export type WaitingRoomStatus =
  | "waiting"          // Paciente en cola
  | "in_consultation"  // Actualmente en consulta
  | "completed"        // Consulta finalizada
  | "canceled"         // Cancelado
  | "pending";         // Cita del día aún no confirmada

// --- Urgencia (priority) en la sala de espera
export type WaitingRoomPriority =
  | "normal"     // Paciente estándar
  | "emergency"; // Paciente promovido a emergencia

// --- Origen de la llegada (source_type)
export type WaitingRoomSourceType =
  | "scheduled"  // Paciente con cita programada
  | "walkin";    // Paciente sin cita, llega directo

// --- Entrada de la sala de espera
export interface WaitingRoomEntry {
  id: number;
  patient: PatientRef;          // objeto { id, name }
  appointment_id: number | null;
  appointment_status?: WaitingRoomStatus; // 👈 añadido como opcional
  status: WaitingRoomStatus;
  arrival_time: string | null;  // ISO string
  priority: WaitingRoomPriority;
  source_type: WaitingRoomSourceType;
  order: number;
}

// --- Datos de entrada para crear/editar entrada en sala de espera
export interface WaitingRoomEntryInput {
  patient: number;              // id del paciente
  appointment_id: number | null;
  priority?: WaitingRoomPriority;
  source_type?: WaitingRoomSourceType;
}

// --- Grupo de sala de espera por estado
export interface WaitingroomGroupByStatus {
  status: string; // waiting, in_consultation, completed, canceled, pending
  total: number;
}

// --- Grupo de sala de espera por prioridad + origen
export interface WaitingroomGroupByPriority {
  priority: WaitingRoomPriority;       // normal | emergency
  source_type: WaitingRoomSourceType;  // scheduled | walkin
  total: number;
}

// --- Respuesta completa del endpoint /waitingroom/groups-today/
export interface WaitingroomGroupsTodayResponse {
  by_status: WaitingroomGroupByStatus[];
  by_priority: WaitingroomGroupByPriority[];
}
