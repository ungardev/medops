// src/types/medicalReport.ts

// =====================================================
// IMPORTAR TIPOS DE identidad en lugar de config.ts
// =====================================================
import type { IdentityDoctor, IdentityInstitution } from "./identity";
// =====================================================
// INFORME MÉDICO GENERADO DESDE UNA CONSULTA/APPOINTMENT
// =====================================================
export interface MedicalReport {
  id: number;
  appointment: number;
  patient: number;
  created_at: string;
  status: "generated";
  file_url?: string | null;
  audit_code?: string | null;
  qr_code_url?: string | null;
  
  // 🔹 CAMBIADO DE: config.ts → identity.ts (tipos cacheados para lectura)
  institution?: IdentityInstitution | null;
  doctor?: IdentityDoctor | null;
  
  // 🔹 AGREGADO: Opciones adicionales que devuelve el endpoint
  options?: {
    verbose_name: string;
  };
}