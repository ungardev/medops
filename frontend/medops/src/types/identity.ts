// src/types/identity.ts
// =====================================================
// TIPOS DE IDENTIDAD CACHED DEL BACKEND
// =====================================================
// Estos tipos representan los campos CACHED que aparecen
// en múltiples modelos (Payment, Treatment, MedicalDocument, etc.)
// para optimización de consultas y reportes.
export interface IdentityPatient {
  id: number;
  national_id: string | null;
  full_name: string;
  gender: "M" | "F" | "Other" | "Unknown";
}
export interface IdentityDoctor {
  id: number;
  full_name: string;
  colegiado_id: string;
  gender: "M" | "F" | "Other" | "Unknown";
  is_verified: boolean;
  // Add these:
  specialty?: string;
  license?: string;
  signature?: string;
}
// IdentityInstitution - add missing fields  
export interface IdentityInstitution {
  id: number;
  name: string;
  tax_id: string;
  is_active: boolean;
  // Add these:
  logo?: string;
  address?: string;
  phone?: string;
}