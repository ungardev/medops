// src/types/consultation.ts
// =====================================================
// IMPORTAR TIPOS DESDE identity.ts
// =====================================================
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "./identity";
import type { ChargeOrder } from "./payments";
// =====================================================
// ENUMS - Alineados con backend (choices.py y models.py)
// =====================================================
export type DiagnosisType = 
  | "presumptive"   // Presuntivo (Sospecha)
  | "definitive"    // Definitivo (Decretado/Confirmado)
  | "differential"  // Diferencial (Opción en estudio)
  | "provisional";  // Provisional
export type DiagnosisStatus = 
  | "under_investigation"  // En Investigación / Estudio
  | "awaiting_results"     // Esperando Resultados (Lab/Imagen)
  | "confirmed"            // Decretado / Confirmado
  | "ruled_out"           // Descartado / Excluido
  | "chronic";             // Pre-existente / Crónico
export type TreatmentType = 
  | "pharmacological"  // Farmacológico
  | "surgical"        // Quirúrgico / Procedimiento
  | "rehabilitation"  // Fisioterapia / Rehabilitación
  | "lifestyle"       // Cambio de estilo de vida / Dieta
  | "psychological"    // Apoyo Psicológico / Terapia
  | "other";          // Otro
export type TreatmentStatus = 
  | "active"        // En curso / Activo
  | "completed"     // Finalizado / Completado
  | "suspended"     // Suspendido Temporalmente
  | "cancelled";    // Cancelado / Contraindicado
export type PrescriptionRoute = 
  | "oral" | "iv" | "im" | "sc"
  | "topical" | "sublingual" | "inhalation"
  | "rectal" | "other";
export type PrescriptionFrequency = 
  | "once_daily" | "bid" | "tid" | "qid"
  | "q4h" | "q6h" | "q8h" | "q12h" | "q24h"
  | "qod" | "stat" | "prn" | "hs"
  | "ac" | "pc" | "achs";
export type PrescriptionUnit = 
  | "mg" | "ml" | "g"
  | "tablet" | "capsule" | "drop"
  | "puff" | "unit" | "patch";
export type MedicalTestUrgency = "routine" | "urgent" | "stat";
export type MedicalTestStatus = "pending" | "completed" | "cancelled";
export type MedicalReferralUrgency = "routine" | "urgent" | "stat";
export type MedicalReferralStatus = "issued" | "accepted" | "rejected";
// =====================================================
// DIAGNOSIS - Alineado con DiagnosisSerializer (backend)
// =====================================================
export interface Diagnosis {
  id: number;
  appointment: number;
  // Metadatos ICD-11
  icd_code: string;
  title?: string;
  foundation_id?: string;
  description?: string;
  // Campos clínicos (del backend)
  type: DiagnosisType;
  type_display?: string;
  status: DiagnosisStatus;
  status_display?: string;
  clinical_certainty: number;
  is_main_diagnosis: boolean;
  // Relaciones
  treatments: Treatment[];
  prescriptions: Prescription[];
  // Auditoría
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  // 🆕 AGREGADO: name (compatibilidad con componente)
  name?: string;
  
  // 🆕 AGREGADO: notes (compatibilidad con componente)
  notes?: string | null;
}
// =====================================================
// TRATAMIENTO - Alineado con TreatmentSerializer (backend)
// =====================================================
export interface Treatment {
  id: number;
  diagnosis: number;
  // Campos CACHED del backend (importados desde identity.ts)
  patient?: IdentityPatient;
  doctor?: IdentityDoctor;
  institution?: IdentityInstitution;
  // Definición
  treatment_type: TreatmentType;
  treatment_type_display?: string;
  title: string;
  plan: string;
  // Cronología
  start_date?: string;
  end_date?: string;
  // Estado y control
  status: TreatmentStatus;
  status_display?: string;
  is_permanent: boolean;
  notes?: string | null;
  // Utilidad frontend
  is_active_now?: boolean;
}
// --- Inputs para tratamientos ---
export interface CreateTreatmentInput {
  appointment: number;
  diagnosis: number;
  treatment_type: TreatmentType;
  title: string;
  plan: string;
  start_date?: string;
  end_date?: string;
  is_permanent?: boolean;
  status?: TreatmentStatus;
  notes?: string;
}
export interface UpdateTreatmentInput {
  id: number;
  treatment_type?: TreatmentType;
  title?: string;
  plan?: string;
  start_date?: string;
  end_date?: string;
  is_permanent?: boolean;
  status?: TreatmentStatus;
  notes?: string;
}
// =====================================================
// PRESCRIPCIÓN - Alineado con PrescriptionSerializer (backend)
// =====================================================
export interface PrescriptionComponent {
  id?: number;
  substance: string;
  dosage: string;
  unit: PrescriptionUnit;
  unit_display?: string;
}
export interface Prescription {
  id: number;
  diagnosis: number;
  // Campos CACHED del backend (importados desde identity.ts)
  patient?: IdentityPatient;
  doctor?: IdentityDoctor;
  institution?: IdentityInstitution;
  // Híbrido: catálogo o texto libre
  medication_catalog?: {
    id: number;
    name: string;
    generic_name?: string;
    presentation?: string;
    concentration?: string;
    route?: string;
    unit?: string;
  } | null;
  medication_text?: string | null;
  medication_name?: string;
  // Posología
  dosage_form?: string | null;
  route: PrescriptionRoute;
  route_display?: string;
  frequency: PrescriptionFrequency;
  frequency_display?: string;
  duration?: string | null;
  indications?: string | null;
  // Componentes
  components: PrescriptionComponent[];
  // Auditoría
  issued_at?: string;
  doctor_name?: string;
}
// --- Inputs para prescripciones ---
export interface CreatePrescriptionInput {
  appointment: number;
  diagnosis: number;
  medication_catalog?: number;
  medication_text?: string | null;
  dosage_form?: string;
  route?: PrescriptionRoute;
  frequency?: PrescriptionFrequency;
  duration?: string;
  indications?: string;
  components: PrescriptionComponent[];
}
export interface UpdatePrescriptionInput {
  id: number;
  medication_catalog?: number;
  medication_text?: string | null;
  dosage_form?: string;
  route?: PrescriptionRoute;
  frequency?: PrescriptionFrequency;
  duration?: string;
  indications?: string;
  components?: PrescriptionComponent[];
}
// =====================================================
// EXAMEN MÉDICO - Alineado con backend
// =====================================================
export interface MedicalTest {
  id: number;
  appointment: number;
  diagnosis?: number | null;
  requested_by?: number | null;
  
  test_type: string;
  test_type_display?: string;
  description?: string;
  
  urgency: MedicalTestUrgency;
  urgency_display?: string;
  status: MedicalTestStatus;
  status_display?: string;
  
  requested_at: string;
  completed_at?: string | null;
  
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}
// =====================================================
// REFERENCIA MÉDICA - Alineado con backend
// =====================================================
export interface MedicalReferral {
  id: number;
  appointment: number;
  diagnosis?: number | null;
  issued_by?: number | null;
  
  referred_to: string;
  reason?: string;
  specialties: any[];
  specialty_ids?: number[];
  
  urgency: MedicalReferralUrgency;
  urgency_display?: string;
  status: MedicalReferralStatus;
  status_display?: string;
  
  issued_at: string;
  
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}