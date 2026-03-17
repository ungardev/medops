// src/types/operational.ts
export type OperationalItemType = 'appointment' | 'service' | 'block';
export interface OperationalItem {
  id: number;
  type: OperationalItemType;
  date: string; // YYYY-MM-DD
  time?: string | null; // ✅ CORREGIDO: Permitir null explícitamente
  title: string;
  status: string;
  patientName?: string;
  doctorName?: string;
  serviceName?: string;
  color?: string;
  metadata: Record<string, any>;
}
export interface OperationalHubFilters {
  categories: {
    id: number;
    name: string;
  }[];
  services: {
    id: number;
    name: string;
    category_id: number;
  }[];
}
export interface OperationalHubData {
  timeline: OperationalItem[];
  filters: OperationalHubFilters;
}