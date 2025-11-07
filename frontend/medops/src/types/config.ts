// src/types/config.ts
export interface InstitutionSettings {
  id: number;
  name: string;
  address: string;
  phone: string;
  logo: string;     // URL
  tax_id: string;
}

export interface DoctorConfig {
  id: number;
  fullName: string;
  colegiadoId: string;
  specialty?: string;
  license?: string;
  email?: string;
  phone?: string;
  signature?: string; // URL
}
