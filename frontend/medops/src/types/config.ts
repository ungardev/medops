// src/types/config.ts

export interface InstitutionSettings {
  id?: number;                 // 👈 opcional para evitar errores en estado inicial
  name: string;
  address: string;
  phone: string;
  tax_id: string;
  logo?: string | File;        // 👈 puede ser URL (string) o archivo (File)
}

export interface DoctorConfig {
  id?: number;                 // 👈 opcional para evitar errores en estado inicial
  full_name: string;           // 👈 snake_case para coincidir con backend
  colegiado_id: string;        // 👈 snake_case para coincidir con backend
  specialty?: string;
  license?: string;
  email?: string;
  phone?: string;
  signature?: string | File;   // 👈 puede ser URL o archivo
}
