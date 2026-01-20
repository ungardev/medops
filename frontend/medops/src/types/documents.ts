// src/types/documents.ts
// =====================================================
// IMPORTAR TIPOS DESDE identity.ts
// =====================================================
import type { IdentityDoctor, IdentityInstitution } from "./identity";
// =====================================================
// ENUMS - Alineados con backend
// =====================================================
export type DocumentCategory = 
  | "prescription"
  | "treatment"
  | "medical_test_order"
  | "medical_referral"
  | "medical_report"
  | "external_study"
  | "other";
export type DocumentSource = "system_generated" | "user_uploaded";
// =====================================================
// DOCUMENTO MÉDICO
// =====================================================
export interface MedicalDocument {
  id: number;
  
  // Relaciones
  patient: number;
  patient_name?: string;
  appointment?: number | null;
  diagnosis?: number | null;
  
  // Campos CACHED del backend
  doctor?: IdentityDoctor;
  institution?: IdentityInstitution;
  
  // Clasificación
  category: DocumentCategory;
  category_display?: string;
  source: DocumentSource;
  source_display?: string;
  origin_panel?: string | null;
  
  // Archivo
  description?: string | null;
  file: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  checksum_sha256?: string | null;
  
  // Seguridad y auditoría
  template_version?: string | null;
  is_signed?: boolean;
  signer_name?: string | null;
  signer_registration?: string | null;
  audit_code?: string | null;
  
  // Trazabilidad
  uploaded_at?: string;
  uploaded_by?: number | null;
  uploaded_by_name?: string;
  generated_by?: number | null;
  generated_by_name?: string;
}
// =====================================================
// DATOS DE ENTRADA PARA CREAR DOCUMENTO
// =====================================================
export interface CreateDocumentInput {
  patient: number;
  appointment?: number | null;
  diagnosis?: number | null;
  category: DocumentCategory;
  description?: string | null;
  file: File;
}