// src/types/medication.ts
// Tipos extendidos para el catálogo de medicamentos
export interface MedicationCatalogItem {
  id: number;
  name: string;
  generic_name: string | null;
  presentation: string;
  presentation_display: string;
  concentration: string;
  route: string;
  route_display: string;
  unit: string;
  unit_display: string;
  presentation_size: string | null;
  concentration_detail: Array<{principio: string; cantidad: string}> | null;
  code: string | null;
  inhrr_code: string | null;
  inhrr_status: string | null;
  atc_code: string | null;
  is_controlled: boolean;
  therapeutic_action: string | null;
  source: 'INHRR' | 'MANUAL';
  is_active: boolean;
  last_scraped_at: string | null;
}
// Tipo para medicamentos recientes (subconjunto de MedicationCatalogItem)
export interface RecentMedication {
  id: number;
  name: string;
  generic_name: string | null;
  presentation: string;
  presentation_display: string;
  concentration: string;
  route: string;
  route_display: string;
  unit: string;
  unit_display: string;
  is_controlled: boolean;
  source: 'INHRR' | 'MANUAL';
  used_at: string;
}