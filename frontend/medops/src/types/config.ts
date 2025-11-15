// src/types/config.ts

// 🔹 Configuración institucional
export interface InstitutionSettings {
  id?: number;
  name: string;
  address: string;
  phone: string;
  tax_id: string;
  logo?: string | File;
}

// 🔹 Configuración del médico operador
export interface DoctorConfig {
  id?: number;
  full_name?: string;
  colegiado_id?: string;
  specialty_ids?: number[];   // ✅ IDs numéricos que se envían al backend
  license?: string;
  email?: string;
  phone?: string;
  signature?: string | File;
}
