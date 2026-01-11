// src/types/config.ts

// 🔹 Jerarquía Geográfica para Direcciones
export interface Country { id: number; name: string; }
export interface State { id: number; name: string; country: number; }
export interface Municipality { id: number; name: string; state: number; }
export interface Parish { id: number; name: string; municipality: number; }

export interface Neighborhood {
  id: number;
  name: string;
  parish?: {
    id: number;
    name: string;
    municipality?: {
      id: number;
      name: string;
      state?: {
        id: number;
        name: string;
        country: { id: number; name: string };
      };
    };
  };
}

// 🔹 Configuración institucional
export interface InstitutionSettings {
  id?: number;
  name: string;
  phone: string;
  tax_id: string;
  logo?: string | File | null;
  
  // ⚔️ Nueva Estructura Geográfica
  neighborhood?: number | Neighborhood | null; 
  address: string; // Dirección detallada
}

// 🔹 Especialidad del médico (Sin cambios)
export interface Specialty {
  id: number;
  code: string;
  name: string;
}

// 🔹 Configuración del médico operador (Sin cambios)
export interface DoctorConfig {
  id?: number;
  full_name?: string;
  colegiado_id?: string;
  specialty_ids?: number[];
  specialties?: Specialty[];
  license?: string;
  email?: string;
  phone?: string;
  signature?: string | File | null;
}
