// src/types/waitingRoom.ts
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
  id: number | string;  // 👈 permite ID temporal para optimistic update
  
  // Relaciones
  institution: number;  // 🆕 Segmentación por sede
  patient: {
    id: number;
    full_name: string;
    national_id?: string | null;
  };
  appointment?: number | null;
  
  // Control de tiempos y flujo
  arrival_time: string | null;
  called_at?: string | null;  // 🆕 Hora de llamado a consultorio
  status: WaitingRoomStatus;
  status_display?: string;
  priority: WaitingRoomPriority;
  priority_display?: string;
  source_type: WaitingRoomSourceType;
  order: number;
  
  // Utilidades
  waiting_time_minutes?: number;  // 🆕 Tiempo en minutos
  patient_id_number?: string;  // 🆕 Campo display
  appointment_status?: string;  // 🆕 Campo display
  effective_status?: string;  // 🆕 Estado unificado
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