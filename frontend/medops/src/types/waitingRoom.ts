// src/types/waitingRoom.ts
import type { IdentityInstitution } from "./identity";
// =====================================================
// ENUMS - Alineados con backend
// =====================================================
export type WaitingRoomStatus = 
  | "waiting"          // En Espera
  | "in_consultation"  // En Consulta
  | "completed"        // Completado
  | "canceled"         // Cancelado
  | "no_show";         // No asistió
export type WaitingRoomPriority = 
  | "normal"       // Paciente estándar
  | "preference"   // Preferencial (ancianos/niños)
  | "emergency";    // Emergencia
export type WaitingRoomSourceType = 
  | "scheduled"  // Paciente con cita programada
  | "walkin";    // Paciente sin cita, llega directo
// =====================================================
// ENTRADA DE SALA DE ESPERA
// =====================================================
export interface WaitingRoomEntry {
  id: number | string;
  institution: number;
  institution_data?: IdentityInstitution | null;
  
  patient: {
    id: number;
    full_name: string;
    national_id?: string | null;
  };
  
  // CAMBIO PRINCIPAL: Definir appointment como objeto con serviceId
  appointment?: {
    id: number;
    serviceId?: number; // Alineado con el backend (OperationalHubView)
    status?: string;
    // Agregar otros campos si el backend los envía (ej. patient_id, doctor_service, etc.)
  } | null;
  
  // ... resto de campos existentes
  arrival_time: string | null;
  called_at?: string | null;
  status: WaitingRoomStatus;
  status_display?: string;
  priority: WaitingRoomPriority;
  priority_display?: string;
  source_type: WaitingRoomSourceType;
  order: number;
  waiting_time_minutes?: number;
  patient_id_number?: string;
  appointment_status?: string;
  effective_status?: string;
}
// =====================================================
// DATOS DE ENTRADA PARA CREAR/EDITAR ENTRADA
// =====================================================
export interface WaitingRoomEntryInput {
  patient: number;
  appointment?: number | null;
  priority?: WaitingRoomPriority;
  source_type?: WaitingRoomSourceType;
  notes?: string;
}
// =====================================================
// GRUPO DE SALA DE ESPERA POR ESTADO
// =====================================================
export interface WaitingRoomGroupByStatus {
  status: WaitingRoomStatus;
  total: number;
}
// =====================================================
// GRUPO DE SALA DE ESPERA POR PRIORIDAD + ORIGEN
// =====================================================
export interface WaitingRoomGroupByPriority {
  priority: WaitingRoomPriority;
  source_type: WaitingRoomSourceType;
  total: number;
}
// =====================================================
// RESPUESTA COMPLETA DEL ENDPOINT /waitingroom/groups-today/
// =====================================================
export interface WaitingRoomGroupsTodayResponse {
  by_status: WaitingRoomGroupByStatus[];
  by_priority: WaitingRoomGroupByPriority[];
}