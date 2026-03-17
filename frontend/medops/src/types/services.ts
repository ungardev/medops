// src/types/services.ts
export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  services_count?: number;
  created_at?: string;
  updated_at?: string;
}
export interface DoctorService {
  id: number;
  doctor: number;
  doctor_name?: string;
  category?: number;
  category_name?: string;
  institution?: number;
  code: string;
  name: string;
  description?: string;
  price_usd: number;
  price_ves?: number;
  duration_minutes: number;
  is_active: boolean;
  is_visible_global: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface ServiceCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}
export interface DoctorServiceInput {
  doctor: number | null;
  category?: number | null;
  institution?: number | null;
  code: string;
  name: string;
  description?: string;
  price_usd: number;
  duration_minutes: number;
  is_active: boolean;
  is_visible_global: boolean;
}
export interface ServiceSchedule {
  id: number;
  service: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_appointments: number;
  is_active: boolean;
}
export interface ServiceScheduleInput {
  service: number;
  institution: number;  // ✅ CAMBIO AGREGADO
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_appointments: number;
  is_active?: boolean;
}