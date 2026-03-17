// src/types/operational.ts
// Definición de los tipos de items operativos
export type OperationalItemType = 'appointment' | 'service' | 'block' | 'availability';
// Interfaz unificada para items operativos (Citas + Servicios + Disponibilidad)
export interface OperationalItem {
  // ID puede ser numérico (DB) o string (generado localmente para slots)
  id: number | string;
  
  // Tipo de item
  type: OperationalItemType;
  
  // Fecha y hora
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  
  // Información visual
  title: string;
  status: string;
  isAvailable: boolean;
  
  // Relaciones
  patientName?: string;
  doctorName?: string;
  doctorId?: number;
  serviceName?: string;
  serviceId?: number;
  categoryName?: string;
  categoryId?: number;
  
  // Metadatos específicos para disponibilidad
  slotsRemaining?: number;
  maxSlots?: number;
  
  // Datos crudos (útil para manipulación)
  metadata: Record<string, any>;
}
// Interfaz para filtros del hub
export interface OperationalHubFilters {
  categories: {
    id: number;
    name: string;
  }[];
  services: {
    id: number;
    name: string;
    category_id: number;
    category_name?: string;
    doctor_name?: string;
    doctor_id?: number;
  }[];
}
// Interfaz para estadísticas
export interface OperationalStats {
  total_items: number;
  appointments_count: number;
  availability_count: number;
  dates_with_activity: number;
  avg_items_per_day: number;
  period_days: number;
}
// Interfaz para metadatos del periodo
export interface OperationalMetadata {
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  total_days: number;
}
// Interfaz completa de respuesta del backend
export interface OperationalHubResponse {
  timeline: OperationalItem[];
  live_queue: any[];
  pending_entries: any[];
  filters: OperationalHubFilters;
  stats: OperationalStats;
  metadata: OperationalMetadata;
}